import { Router, type IRouter } from "express";
import { eq, desc, and, gt, lt, isNull, or } from "drizzle-orm";
import {
  db,
  postsTable,
  reactionsTable,
  reportsTable,
  moderationBlocksTable,
  sessionBansTable,
} from "@workspace/db";
import {
  ListPostsQueryParams,
  CreatePostBody,
  GetPostParams,
  AddEchoReactionParams,
  AddEchoReactionBody,
  ReportPostParams,
  ReportPostBody,
} from "@workspace/api-zod";
import { buildReactionCounts, buildPostResponse, buildAdminPostResponse } from "../lib/postHelpers";
import { checkContent } from "../lib/moderationEngine";

const router: IRouter = Router();

// Extract the best available client identifier from the request
function getClientId(req: Parameters<typeof router.get>[1] extends (req: infer R, ...args: any[]) => any ? R : never): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(",")[0].trim();
  }
  return req.ip || "unknown";
}

// GET /posts — live feed of active (non-expired, non-removed) posts
router.get("/posts", async (req, res): Promise<void> => {
  const query = ListPostsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { emotionTag, noTag, cursor, limit: rawLimit } = query.data;
  const limit = Math.min(rawLimit ?? 20, 50);
  const now = new Date();

  const conditions = [
    eq(postsTable.isRemoved, false),
    gt(postsTable.expiresAt, now),
  ];

  if (noTag) {
    conditions.push(or(isNull(postsTable.emotionTag), eq(postsTable.emotionTag, ""))!);
  } else if (emotionTag) {
    conditions.push(eq(postsTable.emotionTag, emotionTag));
  }

  if (cursor) {
    conditions.push(lt(postsTable.id, cursor));
  }

  const posts = await db
    .select()
    .from(postsTable)
    .where(and(...conditions))
    .orderBy(desc(postsTable.createdAt))
    .limit(limit);

  const postIds = posts.map((p) => p.id);
  if (postIds.length === 0) {
    res.json([]);
    return;
  }

  const reactions = await db
    .select()
    .from(reactionsTable)
    .where(
      postIds.length === 1
        ? eq(reactionsTable.postId, postIds[0])
        : or(...postIds.map((id) => eq(reactionsTable.postId, id)))
    );

  const reports = await db
    .select()
    .from(reportsTable)
    .where(
      postIds.length === 1
        ? eq(reportsTable.postId, postIds[0])
        : or(...postIds.map((id) => eq(reportsTable.postId, id)))
    );

  const result = posts.map((post) => {
    const postReactions = reactions.filter((r) => r.postId === post.id);
    const postReports = reports.filter((r) => r.postId === post.id);
    return buildPostResponse(post, postReactions, postReports.length);
  });

  res.json(result);
});

// POST /posts — create a new vent (server-side moderation gate)
router.post("/posts", async (req, res): Promise<void> => {
  const parsed = CreatePostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { content, emotionTag, authorName, isAnonymous } = parsed.data;
  const clientId = getClientId(req as any);
  const now = new Date();

  // ── 1. Check session ban ──────────────────────────────────────────────────
  const [ban] = await db
    .select()
    .from(sessionBansTable)
    .where(eq(sessionBansTable.sessionId, clientId))
    .limit(1);

  if (ban) {
    if (!ban.expiresAt || ban.expiresAt > now) {
      res.status(403).json({
        error: "Your access to posting has been temporarily restricted due to repeated policy violations.",
      });
      return;
    }
    // Expired ban — remove it
    await db.delete(sessionBansTable).where(eq(sessionBansTable.sessionId, clientId));
  }

  // ── 2. Rate limiting ──────────────────────────────────────────────────────
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const recentPostsMinute = await db
    .select({ id: postsTable.id })
    .from(postsTable)
    .where(
      and(
        eq(postsTable.sessionId, clientId),
        gt(postsTable.createdAt, oneMinuteAgo),
        eq(postsTable.isAiReflection, false)
      )
    );

  if (recentPostsMinute.length >= 3) {
    res.status(429).json({
      error: "You're posting too quickly. Please wait a moment before posting again.",
      retryAfterSeconds: 60,
    });
    return;
  }

  const recentPostsHour = await db
    .select({ id: postsTable.id })
    .from(postsTable)
    .where(
      and(
        eq(postsTable.sessionId, clientId),
        gt(postsTable.createdAt, oneHourAgo),
        eq(postsTable.isAiReflection, false)
      )
    );

  if (recentPostsHour.length >= 20) {
    res.status(429).json({
      error: "You've reached the hourly posting limit. Please wait before posting again.",
      retryAfterSeconds: 3600,
    });
    return;
  }

  // ── 3. Duplicate detection ────────────────────────────────────────────────
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
  const [duplicate] = await db
    .select({ id: postsTable.id })
    .from(postsTable)
    .where(
      and(
        eq(postsTable.sessionId, clientId),
        eq(postsTable.content, content),
        gt(postsTable.createdAt, thirtyMinutesAgo)
      )
    )
    .limit(1);

  if (duplicate) {
    res.status(422).json({ error: "You already posted this recently. Please wait before posting the same content again." });
    return;
  }

  // ── 4. Server-side moderation ─────────────────────────────────────────────
  const modResult = checkContent(content);

  if (modResult.severity === "high") {
    // Log the blocked attempt
    await db.insert(moderationBlocksTable).values({
      sessionId: clientId,
      contentSnippet: content.slice(0, 200),
      severity: "high",
      flagType: modResult.flagType,
      detectedPattern: modResult.detectedPattern || null,
    });

    // Count HIGH violations in the last 24h — auto-ban after 3
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const violations = await db
      .select({ id: moderationBlocksTable.id })
      .from(moderationBlocksTable)
      .where(
        and(
          eq(moderationBlocksTable.sessionId, clientId),
          eq(moderationBlocksTable.severity, "high"),
          gt(moderationBlocksTable.createdAt, twentyFourHoursAgo)
        )
      );

    if (violations.length >= 3) {
      const banExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      await db
        .insert(sessionBansTable)
        .values({
          sessionId: clientId,
          reason: `Automated: ${violations.length} high-severity violations in 24h`,
          violationCount: violations.length,
          expiresAt: banExpiry,
        })
        .onConflictDoNothing();
    }

    res.status(422).json({
      error: modResult.message || "This content violates our community guidelines and cannot be published.",
    });
    return;
  }

  // ── 5. Save the post ──────────────────────────────────────────────────────
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (isAnonymous ? 7 : 30));

  const isMedium = modResult.severity === "medium";

  // Log MEDIUM content for admin review tracking
  if (isMedium) {
    await db.insert(moderationBlocksTable).values({
      sessionId: clientId,
      contentSnippet: content.slice(0, 200),
      severity: "medium",
      flagType: modResult.flagType,
      detectedPattern: modResult.detectedPattern || null,
    });
  }

  const [post] = await db
    .insert(postsTable)
    .values({
      content,
      emotionTag: emotionTag || null,
      authorName: isAnonymous ? null : (authorName ?? null),
      isAnonymous,
      expiresAt,
      sessionId: clientId,
      // MEDIUM posts are saved flagged and hidden — visible to admin only
      isFlagged: isMedium,
      isRemoved: isMedium,
      moderationNote: isMedium ? `Auto-flagged (${modResult.flagType}): pending review` : null,
    })
    .returning();

  res.status(201).json(buildPostResponse(post, [], 0));
});

// GET /posts/summary — feed stats for the live banner
router.get("/posts/summary", async (_req, res): Promise<void> => {
  const now = new Date();

  const activePosts = await db
    .select()
    .from(postsTable)
    .where(and(eq(postsTable.isRemoved, false), gt(postsTable.expiresAt, now)));

  const activePostCount = activePosts.length;

  const emotionMap: Record<string, number> = {};
  for (const post of activePosts) {
    if (post.emotionTag) {
      emotionMap[post.emotionTag] = (emotionMap[post.emotionTag] ?? 0) + 1;
    }
  }

  let topEmotion: string | null = null;
  let topCount = 0;
  for (const [tag, count] of Object.entries(emotionMap)) {
    if (count > topCount) {
      topCount = count;
      topEmotion = tag;
    }
  }

  const activePostIds = activePosts.map((p) => p.id);
  let totalReactions = 0;
  if (activePostIds.length > 0) {
    const reactions = await db
      .select()
      .from(reactionsTable)
      .where(
        activePostIds.length === 1
          ? eq(reactionsTable.postId, activePostIds[0])
          : or(...activePostIds.map((id) => eq(reactionsTable.postId, id)))
      );
    totalReactions = reactions.length;
  }

  res.json({ activePostCount, totalReactions, topEmotion });
});

// GET /posts/:id — single post
router.get("/posts/:id", async (req, res): Promise<void> => {
  const params = GetPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [post] = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.id, params.data.id));

  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const reactions = await db
    .select()
    .from(reactionsTable)
    .where(eq(reactionsTable.postId, post.id));

  const reports = await db
    .select()
    .from(reportsTable)
    .where(eq(reportsTable.postId, post.id));

  res.json(buildPostResponse(post, reactions, reports.length));
});

// POST /posts/:id/echo — add an Echo reaction
router.post("/posts/:id/echo", async (req, res): Promise<void> => {
  const params = AddEchoReactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = AddEchoReactionBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [post] = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.id, params.data.id));

  if (!post || post.isRemoved) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  await db.insert(reactionsTable).values({
    postId: params.data.id,
    reactionType: body.data.reactionType,
  });

  const reactions = await db
    .select()
    .from(reactionsTable)
    .where(eq(reactionsTable.postId, params.data.id));

  res.json(buildReactionCounts(reactions));
});

// POST /posts/:id/reports — report a post
router.post("/posts/:id/reports", async (req, res): Promise<void> => {
  const params = ReportPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = ReportPostBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [post] = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.id, params.data.id));

  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const [report] = await db
    .insert(reportsTable)
    .values({
      postId: params.data.id,
      reason: body.data.reason,
      details: body.data.details ?? null,
    })
    .returning();

  // Auto-flag post after 5 or more reports
  if (!post.isFlagged) {
    const allReports = await db
      .select({ id: reportsTable.id })
      .from(reportsTable)
      .where(eq(reportsTable.postId, params.data.id));

    if (allReports.length >= 5) {
      await db
        .update(postsTable)
        .set({ isFlagged: true })
        .where(eq(postsTable.id, params.data.id));
    }
  }

  res.status(201).json({
    id: report.id,
    postId: report.postId,
    reason: report.reason,
    details: report.details,
    createdAt: report.createdAt.toISOString(),
  });
});

export default router;

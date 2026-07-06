import { Router, type IRouter } from "express";
import { eq, desc, and, lt, or, ilike } from "drizzle-orm";
import { db, postsTable, reactionsTable, reportsTable, moderationLogsTable } from "@workspace/db";
import {
  ListAdminPostsQueryParams,
  ModeratePostParams,
  ModeratePostBody,
  ListAdminReportsQueryParams,
} from "@workspace/api-zod";
import { buildAdminPostResponse } from "../lib/postHelpers.js";

const router: IRouter = Router();

// POST /admin/auth — verify admin password (never returns the password, just ok/configured)
router.post("/admin/auth", async (req, res): Promise<void> => {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    res.json({ ok: false, configured: false });
    return;
  }

  const { password } = req.body ?? {};
  res.json({ ok: password === adminPassword, configured: true });
});

// GET /admin/posts — all posts with moderation info
router.get("/admin/posts", async (req, res): Promise<void> => {
  const query = ListAdminPostsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { flagged, cursor } = query.data;
  const limit = 30;

  // Support optional search query param
  const searchQuery = typeof req.query.search === "string" ? req.query.search.trim() : null;

  const conditions = [];

  if (flagged === true) {
    conditions.push(eq(postsTable.isFlagged, true));
  }

  if (cursor) {
    conditions.push(lt(postsTable.id, cursor));
  }

  if (searchQuery) {
    conditions.push(ilike(postsTable.content, `%${searchQuery}%`));
  }

  const posts = await db
    .select()
    .from(postsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
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
    return buildAdminPostResponse(post, postReactions, postReports.length);
  });

  res.json(result);
});

// PATCH /admin/posts/:id — moderate a post (remove, flag, unflag, restore)
router.patch("/admin/posts/:id", async (req, res): Promise<void> => {
  const params = ModeratePostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = ModeratePostBody.safeParse(req.body);
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

  const { action, note } = body.data;

  let updateValues: Partial<typeof postsTable.$inferInsert> = {};

  if (action === "remove") {
    updateValues = { isRemoved: true, moderationNote: note ?? "Removed by admin" };
  } else if (action === "flag") {
    updateValues = { isFlagged: true, moderationNote: note ?? "Flagged for review" };
  } else if (action === "unflag") {
    updateValues = { isFlagged: false, moderationNote: note ?? null };
  } else if (action === "restore") {
    updateValues = { isRemoved: false, isFlagged: false, moderationNote: note ?? null };
  }

  const [updated] = await db
    .update(postsTable)
    .set(updateValues)
    .where(eq(postsTable.id, params.data.id))
    .returning();

  // Log the moderation action for audit trail
  await db.insert(moderationLogsTable).values({
    postId: params.data.id,
    action,
    note: note ?? null,
  });

  const reactions = await db
    .select()
    .from(reactionsTable)
    .where(eq(reactionsTable.postId, updated.id));

  const reports = await db
    .select()
    .from(reportsTable)
    .where(eq(reportsTable.postId, updated.id));

  res.json(buildAdminPostResponse(updated, reactions, reports.length));
});

// GET /admin/reports — list all reports
router.get("/admin/reports", async (req, res): Promise<void> => {
  const query = ListAdminReportsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { cursor } = query.data;
  const limit = 50;

  const conditions = [];
  if (cursor) {
    conditions.push(lt(reportsTable.id, cursor));
  }

  const reports = await db
    .select()
    .from(reportsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(reportsTable.createdAt))
    .limit(limit);

  res.json(
    reports.map((r) => ({
      id: r.id,
      postId: r.postId,
      reason: r.reason,
      details: r.details,
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

export default router;

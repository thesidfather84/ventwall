import { Router, type IRouter } from "express";
import { desc, and, gte, count, eq } from "drizzle-orm";
import { db, postsTable, aiReflectionLogTable } from "@workspace/db";
import { readFileSync } from "fs";
import { resolve } from "path";

const router: IRouter = Router();

// Rate limit constants
const MIN_GAP_MS = 30 * 60 * 1000; // 30 minutes minimum between reflections
const MAX_PER_DAY = 24;
const HIGH_ACTIVITY_THRESHOLD = 10; // real posts in last hour → suppress
const REFLECTION_EXPIRY_HOURS = 48;

// Load prompts from local JSON — resolved relative to project root
let _reflections: string[] = [];
let _dailyPrompts: string[] = [];

function findDataFilePath(): string | null {
  // Vercel serverless: process.cwd() is the project root (/var/task)
  const fromRoot = resolve(process.cwd(), "data/reflections.json");
  try { readFileSync(fromRoot); return fromRoot; } catch { /* try next */ }

  // Replit / local dev: process.cwd() is artifacts/api-server
  const fromArtifact = resolve(process.cwd(), "../../data/reflections.json");
  try { readFileSync(fromArtifact); return fromArtifact; } catch { /* none found */ }

  return null;
}

function loadPrompts() {
  if (_reflections.length) return;
  try {
    const filePath = findDataFilePath();
    if (!filePath) throw new Error("reflections.json not found");
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw) as { reflections: string[]; dailyPrompts: string[] };
    _reflections = parsed.reflections ?? [];
    _dailyPrompts = parsed.dailyPrompts ?? [];
  } catch {
    // Fallback if path resolution varies
    _reflections = [
      "I wonder how many people are carrying something they never say out loud.",
      "What would you say if nobody judged you?",
      "What feeling have you been trying to outrun lately?",
      "What are you pretending is fine?",
      "Some burdens feel lighter once they're written down.",
      "There's a version of you that nobody has ever fully seen.",
    ];
    _dailyPrompts = [
      "What is something you've been carrying alone?",
      "What would you say if nobody judged you?",
      "What feeling have you been trying to outrun lately?",
    ];
  }
}

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getTodayDateString() {
  return new Date().toISOString().split("T")[0];
}

function getDailyPromptForDate(dateStr: string): string {
  loadPrompts();
  // Deterministic per day — same prompt all day, changes at midnight
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  return _dailyPrompts[hash % _dailyPrompts.length];
}

// GET /reflections/daily-prompt
router.get("/reflections/daily-prompt", async (_req, res): Promise<void> => {
  const date = getTodayDateString();
  const prompt = getDailyPromptForDate(date);
  res.json({ prompt, date });
});

// POST /reflections/generate — rate-limited, picks randomly from local JSON
router.post("/reflections/generate", async (_req, res): Promise<void> => {
  loadPrompts();

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // 1. Daily cap
  const [{ value: todayCount }] = await db
    .select({ value: count() })
    .from(aiReflectionLogTable)
    .where(gte(aiReflectionLogTable.generatedAt, startOfDay));

  if (todayCount >= MAX_PER_DAY) {
    res.status(429).json({ error: "Daily reflection limit reached.", retryAfterSeconds: 3600 });
    return;
  }

  // 2. Minimum gap since last reflection
  const [lastReflection] = await db
    .select()
    .from(aiReflectionLogTable)
    .orderBy(desc(aiReflectionLogTable.generatedAt))
    .limit(1);

  if (lastReflection) {
    const elapsed = now.getTime() - new Date(lastReflection.generatedAt).getTime();
    if (elapsed < MIN_GAP_MS) {
      const retryAfterSeconds = Math.ceil((MIN_GAP_MS - elapsed) / 1000);
      res.status(429).json({ error: "Too soon since last reflection.", retryAfterSeconds });
      return;
    }
  }

  // 3. Suppress when real user activity is high
  const [{ value: recentRealPosts }] = await db
    .select({ value: count() })
    .from(postsTable)
    .where(
      and(
        eq(postsTable.isAiReflection, false),
        eq(postsTable.isRemoved, false),
        gte(postsTable.createdAt, oneHourAgo)
      )
    );

  if (recentRealPosts >= HIGH_ACTIVITY_THRESHOLD) {
    res.status(429).json({
      error: "Wall is active with real voices — reflection suppressed.",
      retryAfterSeconds: 1800,
    });
    return;
  }

  // 4. Pick a random reflection that hasn't appeared recently
  const recentLogs = await db
    .select({ content: aiReflectionLogTable.content })
    .from(aiReflectionLogTable)
    .orderBy(desc(aiReflectionLogTable.generatedAt))
    .limit(10);

  const recentContents = new Set(recentLogs.map((r) => r.content));
  const available = _reflections.filter((r) => !recentContents.has(r));
  const content = available.length > 0 ? pickRandom(available) : pickRandom(_reflections);

  // 5. Insert as a post
  const expiresAt = new Date(now.getTime() + REFLECTION_EXPIRY_HOURS * 60 * 60 * 1000);

  const [post] = await db
    .insert(postsTable)
    .values({
      content,
      isAnonymous: true,
      authorName: null,
      emotionTag: null,
      isAiReflection: true,
      isDailyPrompt: false,
      expiresAt,
      sessionId: "ai-reflection",
    })
    .returning();

  // 6. Log for rate limiting
  await db.insert(aiReflectionLogTable).values({
    content,
    isDailyPrompt: false,
    postId: String(post.id),
  });

  res.status(201).json({
    ...post,
    expiresAt: post.expiresAt.toISOString(),
    createdAt: post.createdAt.toISOString(),
    reactionCounts: {
      heard: 0, iFeelThat: 0, sameWave: 0, notAlone: 0,
      letItBurn: 0, keepGoing: 0, neededThis: 0,
    },
    reportCount: 0,
  });
});

export default router;

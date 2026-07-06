import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "posts" (
    "id" serial PRIMARY KEY,
    "content" text NOT NULL,
    "emotion_tag" text,
    "author_name" text,
    "is_anonymous" boolean NOT NULL DEFAULT true,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "is_removed" boolean NOT NULL DEFAULT false,
    "is_flagged" boolean NOT NULL DEFAULT false,
    "moderation_note" text,
    "session_id" text,
    "is_ai_reflection" boolean NOT NULL DEFAULT false,
    "is_daily_prompt" boolean NOT NULL DEFAULT false
  )`,
  `CREATE TABLE IF NOT EXISTS "reactions" (
    "id" serial PRIMARY KEY,
    "post_id" integer NOT NULL,
    "reaction_type" text NOT NULL,
    "session_id" text,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "reports" (
    "id" serial PRIMARY KEY,
    "post_id" integer NOT NULL,
    "reason" text NOT NULL,
    "details" text,
    "session_id" text,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "moderation_logs" (
    "id" serial PRIMARY KEY,
    "post_id" integer NOT NULL,
    "action" text NOT NULL,
    "note" text,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "ai_reflection_log" (
    "id" serial PRIMARY KEY,
    "generated_at" timestamp with time zone NOT NULL DEFAULT now(),
    "content" text NOT NULL,
    "is_daily_prompt" boolean NOT NULL DEFAULT false,
    "post_id" text
  )`,
  `CREATE TABLE IF NOT EXISTS "moderation_blocks" (
    "id" serial PRIMARY KEY,
    "session_id" text,
    "content_snippet" text,
    "severity" text NOT NULL,
    "flag_type" text NOT NULL,
    "detected_pattern" text,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "session_bans" (
    "id" serial PRIMARY KEY,
    "session_id" text NOT NULL UNIQUE,
    "reason" text,
    "violation_count" integer NOT NULL DEFAULT 1,
    "banned_at" timestamp with time zone NOT NULL DEFAULT now(),
    "expires_at" timestamp with time zone
  )`,
];

// TEMPORARY — one-time schema bootstrap for the freshly connected Neon
// database. Protected by ADMIN_PASSWORD; remove this route once the schema
// has been applied (tracked in the PR description).
router.post("/admin/migrate", async (req, res): Promise<void> => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const provided = req.headers["x-admin-password"];

  if (!adminPassword || provided !== adminPassword) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const client = await pool.connect();
  try {
    for (const statement of STATEMENTS) {
      await client.query(statement);
    }
    res.json({ ok: true, tablesEnsured: STATEMENTS.length });
  } finally {
    client.release();
  }
});

export default router;

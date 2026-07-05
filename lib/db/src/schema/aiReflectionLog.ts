import { pgTable, serial, timestamp, text, boolean } from "drizzle-orm/pg-core";

// Tracks AI reflection generation to enforce rate limits
export const aiReflectionLogTable = pgTable("ai_reflection_log", {
  id: serial("id").primaryKey(),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
  content: text("content").notNull(),
  isDailyPrompt: boolean("is_daily_prompt").notNull().default(false),
  postId: text("post_id"),
});

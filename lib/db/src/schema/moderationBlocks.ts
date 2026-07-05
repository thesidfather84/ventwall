import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const moderationBlocksTable = pgTable("moderation_blocks", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id"),
  contentSnippet: text("content_snippet"),
  severity: text("severity").notNull(),
  flagType: text("flag_type").notNull(),
  detectedPattern: text("detected_pattern"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ModerationBlock = typeof moderationBlocksTable.$inferSelect;

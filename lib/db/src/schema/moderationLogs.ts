import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Moderation logs — audit trail of admin actions
export const moderationLogsTable = pgTable("moderation_logs", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  action: text("action").notNull(), // remove | flag | unflag | restore
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertModerationLogSchema = createInsertSchema(moderationLogsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertModerationLog = z.infer<typeof insertModerationLogSchema>;
export type ModerationLog = typeof moderationLogsTable.$inferSelect;

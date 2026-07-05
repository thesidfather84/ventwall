import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Valid echo reaction types
export const ECHO_REACTION_TYPES = [
  "heard",
  "iFeelThat",
  "sameWave",
  "notAlone",
  "letItBurn",
  "keepGoing",
  "neededThis",
] as const;

// Reactions table — one row per echo reaction on a post
export const reactionsTable = pgTable("reactions", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  reactionType: text("reaction_type").notNull(),
  // Optional session ID to prevent duplicate reactions per session
  sessionId: text("session_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertReactionSchema = createInsertSchema(reactionsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertReaction = z.infer<typeof insertReactionSchema>;
export type Reaction = typeof reactionsTable.$inferSelect;

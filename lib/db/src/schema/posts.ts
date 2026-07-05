import {
  pgTable,
  text,
  serial,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Posts table — each vent/post on the wall
export const postsTable = pgTable("posts", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  // Emotion tag is optional — posts flow to the wall regardless of category
  emotionTag: text("emotion_tag"),
  // authorName is null when posting anonymously
  authorName: text("author_name"),
  isAnonymous: boolean("is_anonymous").notNull().default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  // Moderation fields
  isRemoved: boolean("is_removed").notNull().default(false),
  isFlagged: boolean("is_flagged").notNull().default(false),
  moderationNote: text("moderation_note"),
  // Session identifier for anonymous abuse prevention (hashed fingerprint)
  sessionId: text("session_id"),
  // AI Reflection fields
  isAiReflection: boolean("is_ai_reflection").notNull().default(false),
  isDailyPrompt: boolean("is_daily_prompt").notNull().default(false),
});

export const insertPostSchema = createInsertSchema(postsTable).omit({
  id: true,
  createdAt: true,
  isRemoved: true,
  isFlagged: true,
  moderationNote: true,
});
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof postsTable.$inferSelect;

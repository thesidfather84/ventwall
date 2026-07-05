import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";

export const sessionBansTable = pgTable("session_bans", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  reason: text("reason"),
  violationCount: integer("violation_count").notNull().default(1),
  bannedAt: timestamp("banned_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

export type SessionBan = typeof sessionBansTable.$inferSelect;

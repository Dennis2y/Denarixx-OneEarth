import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(),
  organization: text("organization").notNull(),
  clearanceLevel: integer("clearance_level").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: false }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

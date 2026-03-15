import { pgTable, serial, text, real, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const siteTypeEnum = pgEnum("site_type", ["village", "clinic", "school", "district", "shelter"]);
export const siteStatusEnum = pgEnum("site_status", ["online", "offline", "warning", "critical"]);
export const riskLevelEnum = pgEnum("risk_level", ["low", "medium", "high", "critical"]);

export const sitesTable = pgTable("sites", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: siteTypeEnum("type").notNull(),
  location: text("location").notNull(),
  country: text("country").notNull(),
  status: siteStatusEnum("status").notNull().default("online"),
  uptime: real("uptime").notNull().default(99.9),
  powerAvailability: real("power_availability").notNull().default(95.0),
  currentRiskLevel: riskLevelEnum("current_risk_level").notNull().default("low"),
  population: integer("population").notNull().default(0),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSiteSchema = createInsertSchema(sitesTable).omit({ id: true, createdAt: true });
export type InsertSite = z.infer<typeof insertSiteSchema>;
export type Site = typeof sitesTable.$inferSelect;

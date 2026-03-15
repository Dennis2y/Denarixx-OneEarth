import { pgTable, serial, text, integer, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const disasterTypeEnum = pgEnum("disaster_type", ["flood", "wildfire", "storm", "earthquake", "infrastructure", "drought"]);
export const disasterSeverityEnum = pgEnum("disaster_severity", ["critical", "warning", "info"]);
export const disasterStatusEnum = pgEnum("disaster_status", ["active", "monitoring", "resolved"]);

export const disasterAlertsTable = pgTable("disaster_alerts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: disasterTypeEnum("type").notNull(),
  severity: disasterSeverityEnum("severity").notNull(),
  region: text("region").notNull(),
  country: text("country").notNull(),
  description: text("description").notNull(),
  affectedPopulation: integer("affected_population").notNull().default(0),
  status: disasterStatusEnum("status").notNull().default("active"),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
});

export const riskZonesTable = pgTable("risk_zones", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: disasterTypeEnum("type").notNull(),
  riskLevel: text("risk_level").notNull(),
  region: text("region").notNull(),
  country: text("country").notNull(),
  preparednessScore: integer("preparedness_score").notNull().default(50),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
});

export const insertDisasterAlertSchema = createInsertSchema(disasterAlertsTable).omit({ id: true });
export type InsertDisasterAlert = z.infer<typeof insertDisasterAlertSchema>;
export type DisasterAlert = typeof disasterAlertsTable.$inferSelect;

export const insertRiskZoneSchema = createInsertSchema(riskZonesTable).omit({ id: true });
export type InsertRiskZone = z.infer<typeof insertRiskZoneSchema>;
export type RiskZone = typeof riskZonesTable.$inferSelect;

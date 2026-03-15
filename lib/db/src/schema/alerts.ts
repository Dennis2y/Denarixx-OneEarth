import { pgTable, serial, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const alertModuleEnum = pgEnum("alert_module", ["energy", "lifemesh", "earthshield"]);
export const alertSeverityEnum = pgEnum("alert_severity", ["critical", "warning", "info"]);
export const alertStatusEnum = pgEnum("alert_status", ["active", "acknowledged", "resolved"]);

export const unifiedAlertsTable = pgTable("unified_alerts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  module: alertModuleEnum("module").notNull(),
  severity: alertSeverityEnum("severity").notNull(),
  location: text("location").notNull(),
  status: alertStatusEnum("status").notNull().default("active"),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUnifiedAlertSchema = createInsertSchema(unifiedAlertsTable).omit({ id: true });
export type InsertUnifiedAlert = z.infer<typeof insertUnifiedAlertSchema>;
export type UnifiedAlert = typeof unifiedAlertsTable.$inferSelect;

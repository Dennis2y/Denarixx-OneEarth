import { pgTable, serial, integer, real, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gridStatusEnum = pgEnum("grid_status", ["stable", "unstable", "offline"]);

export const energyMetricsTable = pgTable("energy_metrics", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id").notNull(),
  solarGeneration: real("solar_generation").notNull(),
  batteryLevel: real("battery_level").notNull(),
  communityLoad: real("community_load").notNull(),
  gridStatus: gridStatusEnum("grid_status").notNull().default("stable"),
  uptime: real("uptime").notNull().default(99.0),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
});

export const insertEnergyMetricSchema = createInsertSchema(energyMetricsTable).omit({ id: true });
export type InsertEnergyMetric = z.infer<typeof insertEnergyMetricSchema>;
export type EnergyMetric = typeof energyMetricsTable.$inferSelect;

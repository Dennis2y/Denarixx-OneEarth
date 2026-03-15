import { pgTable, serial, integer, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const personCategoryEnum = pgEnum("person_category", ["child", "elderly", "family", "vulnerable"]);
export const personStatusEnum = pgEnum("person_status", ["safe", "at-risk", "emergency", "unknown"]);
export const incidentSeverityEnum = pgEnum("incident_severity", ["critical", "warning", "info"]);
export const incidentStatusEnum = pgEnum("incident_status", ["open", "in-progress", "resolved"]);

export const protectedPersonsTable = pgTable("protected_persons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  category: personCategoryEnum("category").notNull(),
  status: personStatusEnum("status").notNull().default("safe"),
  lastKnownLocation: text("last_known_location").notNull(),
  contactName: text("contact_name").notNull(),
  contactPhone: text("contact_phone").notNull(),
  siteId: integer("site_id").notNull(),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const safetyIncidentsTable = pgTable("safety_incidents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: incidentSeverityEnum("severity").notNull(),
  location: text("location").notNull(),
  status: incidentStatusEnum("status").notNull().default("open"),
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
});

export const insertProtectedPersonSchema = createInsertSchema(protectedPersonsTable).omit({ id: true });
export type InsertProtectedPerson = z.infer<typeof insertProtectedPersonSchema>;
export type ProtectedPerson = typeof protectedPersonsTable.$inferSelect;

export const insertSafetyIncidentSchema = createInsertSchema(safetyIncidentsTable).omit({ id: true });
export type InsertSafetyIncident = z.infer<typeof insertSafetyIncidentSchema>;
export type SafetyIncident = typeof safetyIncidentsTable.$inferSelect;

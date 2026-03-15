import { pgTable, serial, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const simulationHistoryTable = pgTable("simulation_history", {
  id: serial("id").primaryKey(),
  scenarioId: text("scenario_id").notNull(),
  scenarioType: text("scenario_type").notNull(),
  scenarioLabel: text("scenario_label").notNull(),
  operatorEmail: text("operator_email").notNull(),
  operatorName: text("operator_name").notNull(),
  operatorRole: text("operator_role").notNull(),
  readinessScore: real("readiness_score").notNull(),
  riskSeverity: text("risk_severity").notNull(),
  affectedSitesCount: integer("affected_sites_count").notNull().default(0),
  affectedPersonsCount: integer("affected_persons_count").notNull().default(0),
  estimatedPopulationAtRisk: integer("estimated_population_at_risk").notNull().default(0),
  resultJson: text("result_json").notNull(),
  simulatedAt: timestamp("simulated_at").notNull().defaultNow(),
});

export const insertSimulationHistorySchema = createInsertSchema(simulationHistoryTable).omit({ id: true, simulatedAt: true });
export type InsertSimulationHistory = z.infer<typeof insertSimulationHistorySchema>;
export type SimulationHistory = typeof simulationHistoryTable.$inferSelect;

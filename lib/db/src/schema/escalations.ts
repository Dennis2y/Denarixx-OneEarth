import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const escalationEventsTable = pgTable("escalation_events", {
  id: serial("id").primaryKey(),
  scenarioId: text("scenario_id").notNull(),
  scenarioType: text("scenario_type").notNull(),
  scenarioLabel: text("scenario_label").notNull(),
  triggerModule: text("trigger_module").notNull(),
  threatScore: text("threat_score").notNull(),
  escalationLevel: text("escalation_level").notNull(),
  deploymentMode: text("deployment_mode").notNull(),
  operatingProtocol: text("operating_protocol").notNull(),
  operatorDirective: text("operator_directive").notNull(),
  recommendedTeamsJson: text("recommended_teams_json").notNull(),
  recommendedActionsJson: text("recommended_actions_json").notNull(),
  actorEmail: text("actor_email").notNull(),
  actorName: text("actor_name").notNull(),
  actorRole: text("actor_role").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEscalationEventSchema = createInsertSchema(escalationEventsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertEscalationEvent = z.infer<typeof insertEscalationEventSchema>;
export type EscalationEvent = typeof escalationEventsTable.$inferSelect;

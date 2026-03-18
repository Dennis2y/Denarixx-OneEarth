import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  sitesTable,
  protectedPersonsTable,
  unifiedAlertsTable,
  energyMetricsTable,
  simulationHistoryTable,
  auditLogTable,
  escalationEventsTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import type { AuthRequest } from "../middlewares/auth.js";
import { broadcastLiveEvent, makeLivePayload, getLiveClientCount } from "../lib/live.js";
import { buildAutoEscalation } from "../lib/auto-escalation.js";
import { buildAutoResponse } from "../lib/auto-response.js";

const router: IRouter = Router();

const VALID_SCENARIOS = [
  "flood_event",
  "severe_storm",
  "wildfire_risk",
  "clinic_power_outage",
  "multi_site_outage",
  "child_emergency_sos",
] as const;

type ScenarioType = typeof VALID_SCENARIOS[number];
type ConsoleAction = "recommend" | "escalate" | "dispatch";
type ThreatLevel = "low" | "medium" | "high" | "critical";
type ResponsePriority = "routine" | "priority" | "urgent" | "immediate";

type QueueItemPayload = {
  kind: "alert" | "site";
  id: number;
  title: string;
  location: string;
  threatScore: number;
  threatLevel: ThreatLevel;
  responsePriority: ResponsePriority;
  recommendedAction?: string;
};

type ScenarioMeta = {
  label: string;
  module: "energy" | "lifemesh" | "earthshield";
  siteTypesAffected: string[];
  baseRisk: "critical" | "warning" | "info";
  readinessPenalty: number;
  actions: string[];
  timelineEvents: Array<{ time: string; event: string; severity: string }>;
};

const SCENARIO_META: Record<ScenarioType, ScenarioMeta> = {
  flood_event: {
    label: "Flood Event",
    module: "earthshield",
    siteTypesAffected: ["village", "shelter"],
    baseRisk: "critical",
    readinessPenalty: 35,
    actions: [
      "Activate emergency water barriers at all Tier-1 flood sites",
      "Evacuate protected persons from low-lying zone clusters",
      "Re-route solar generation to elevated backup storage arrays",
      "Dispatch LifeMesh emergency monitoring to all shelter nodes",
      "Notify district government emergency response authority",
      "Switch grid to isolated island mode to prevent surge damage",
    ],
    timelineEvents: [
      { time: "T+00:00", event: "Flood risk threshold exceeded — EarthShield alert triggered", severity: "critical" },
      { time: "T+00:15", event: "Automated drain systems activated at Tier-1 sites", severity: "warning" },
      { time: "T+00:30", event: "LifeMesh SOS monitoring elevated for at-risk persons", severity: "warning" },
      { time: "T+01:00", event: "Evacuation orders issued for Zone A villages", severity: "critical" },
      { time: "T+02:30", event: "Emergency generator backup activated — grid offline", severity: "critical" },
      { time: "T+04:00", event: "Drone recon confirms site status — all persons accounted", severity: "info" },
    ],
  },
  severe_storm: {
    label: "Severe Storm",
    module: "earthshield",
    siteTypesAffected: ["village", "school", "clinic"],
    baseRisk: "critical",
    readinessPenalty: 28,
    actions: [
      "Lock down all school and clinic sites until storm passes",
      "Activate backup battery reserves — expect grid interruption",
      "Issue shelter-in-place directive for all tracked persons",
      "Deploy storm-resilient comms relays across northern corridor",
      "Pre-position emergency medical teams at district shelters",
      "Monitor atmospheric pressure every 15 minutes via sensor net",
    ],
    timelineEvents: [
      { time: "T+00:00", event: "Cat-3 storm system detected 80km offshore — EarthShield alert", severity: "critical" },
      { time: "T+00:20", event: "Shelter-in-place comms broadcast to all LifeMesh beacons", severity: "warning" },
      { time: "T+00:45", event: "Solar generation drops 60% — batteries engaged", severity: "warning" },
      { time: "T+01:30", event: "Grid instability detected — island mode initiated", severity: "critical" },
      { time: "T+03:00", event: "Storm makes landfall — all systems on emergency power", severity: "critical" },
      { time: "T+06:00", event: "Storm clearing — damage assessment teams dispatched", severity: "info" },
    ],
  },
  wildfire_risk: {
    label: "Wildfire Risk",
    module: "earthshield",
    siteTypesAffected: ["village", "district"],
    baseRisk: "warning",
    readinessPenalty: 20,
    actions: [
      "Establish 5km wildfire exclusion perimeter around active zones",
      "Clear vegetation buffers around all solar panel arrays",
      "Pre-position water tankers at northern district nodes",
      "Activate air quality monitoring for vulnerable persons",
      "Enable automated drone patrol over high-risk forest corridors",
      "Brief community monitors on fire reporting protocols",
    ],
    timelineEvents: [
      { time: "T+00:00", event: "Thermal anomaly detected — satellite data confirms fire risk", severity: "warning" },
      { time: "T+00:30", event: "Air quality advisory issued — LifeMesh vulnerable persons flagged", severity: "warning" },
      { time: "T+01:00", event: "Drone patrol launched — active fire confirmed 12km north", severity: "critical" },
      { time: "T+02:00", event: "Evacuation pre-staging activated for border villages", severity: "warning" },
      { time: "T+04:00", event: "Fire containment teams on site — perimeter held", severity: "info" },
    ],
  },
  clinic_power_outage: {
    label: "Clinic Power Outage",
    module: "energy",
    siteTypesAffected: ["clinic"],
    baseRisk: "critical",
    readinessPenalty: 15,
    actions: [
      "Immediately switch clinic to battery backup — sustain 6+ hours",
      "Alert energy operator team for emergency grid repair",
      "Prioritize power to ICU, emergency ward, and cold storage",
      "Dispatch mobile generator unit to affected site within 45 min",
      "Assess and document power outage root cause for audit",
      "Notify LifeMesh — flag all clinic-registered persons as elevated risk",
    ],
    timelineEvents: [
      { time: "T+00:00", event: "Clinic grid connection lost — battery backup engaged", severity: "critical" },
      { time: "T+00:05", event: "Critical equipment confirmed on UPS — status stable", severity: "warning" },
      { time: "T+00:20", event: "Mobile generator unit dispatched from district depot", severity: "info" },
      { time: "T+00:45", event: "Generator arrives on site — power restored to critical systems", severity: "info" },
      { time: "T+02:00", event: "Grid technician on site — fault identified and repaired", severity: "info" },
    ],
  },
  multi_site_outage: {
    label: "Multi-Site Outage",
    module: "energy",
    siteTypesAffected: ["village", "clinic", "school", "shelter"],
    baseRisk: "critical",
    readinessPenalty: 42,
    actions: [
      "Activate regional emergency power coordination protocol",
      "Triage sites by criticality: clinic > shelter > school > village",
      "Deploy portable battery packs from central depot to Tier-1 sites",
      "Implement demand-response to reduce grid load by 40%",
      "Coordinate with national grid authority for emergency supply",
      "Real-time LifeMesh check-in for all persons at affected sites",
      "Issue public advisory on expected restoration timeline",
    ],
    timelineEvents: [
      { time: "T+00:00", event: "Cascading outage detected across 4+ sites — critical alert", severity: "critical" },
      { time: "T+00:10", event: "Triage protocol activated — clinics prioritized for backup", severity: "critical" },
      { time: "T+00:30", event: "Emergency power convoy dispatched from regional depot", severity: "warning" },
      { time: "T+01:00", event: "Clinics restored — schools and shelters on reduced power", severity: "warning" },
      { time: "T+02:30", event: "National grid liaison engaged — emergency allocation requested", severity: "warning" },
      { time: "T+05:00", event: "Full power restored across all affected sites", severity: "info" },
    ],
  },
  child_emergency_sos: {
    label: "Child Emergency / SOS Escalation",
    module: "lifemesh",
    siteTypesAffected: ["village", "school"],
    baseRisk: "critical",
    readinessPenalty: 10,
    actions: [
      "Immediately dispatch rapid response team to beacon location",
      "Alert nearest community health worker and medical team",
      "Activate drone recon to confirm GPS coordinates",
      "Notify emergency contact / guardian via LifeMesh app",
      "Escalate to district child protection authority",
      "Log incident chain-of-custody for government audit trail",
    ],
    timelineEvents: [
      { time: "T+00:00", event: "SOS triggered by child bio-signature — LifeMesh CRITICAL alert", severity: "critical" },
      { time: "T+00:02", event: "GPS beacon confirmed — location locked to 15m radius", severity: "critical" },
      { time: "T+00:05", event: "Drone recon launched — visual confirmation in 4 minutes", severity: "warning" },
      { time: "T+00:09", event: "Drone visual: child confirmed, assistance required", severity: "critical" },
      { time: "T+00:15", event: "Ground response team ETA 8 minutes — guardian notified", severity: "warning" },
      { time: "T+00:23", event: "Response team on site — child secured and stable", severity: "info" },
    ],
  },
};

function deriveScenarioFromItem(item?: QueueItemPayload | null): ScenarioType {
  if (!item) return "multi_site_outage";

  const title = item.title.toLowerCase();
  const location = item.location.toLowerCase();
  const combined = `${title} ${location}`;

  if (combined.includes("child") || combined.includes("sos")) return "child_emergency_sos";
  if (combined.includes("clinic") || combined.includes("hospital")) return "clinic_power_outage";
  if (combined.includes("flood")) return "flood_event";
  if (combined.includes("storm")) return "severe_storm";
  if (combined.includes("wildfire") || combined.includes("fire")) return "wildfire_risk";
  if (item.threatLevel === "critical" || item.responsePriority === "immediate") return "multi_site_outage";

  return "multi_site_outage";
}

function validateQueueItem(item: unknown): item is QueueItemPayload {
  if (!item || typeof item !== "object") return false;

  const value = item as QueueItemPayload;

  return (
    (value.kind === "alert" || value.kind === "site") &&
    typeof value.id === "number" &&
    typeof value.title === "string" &&
    typeof value.location === "string" &&
    typeof value.threatScore === "number" &&
    ["low", "medium", "high", "critical"].includes(value.threatLevel) &&
    ["routine", "priority", "urgent", "immediate"].includes(value.responsePriority)
  );
}

async function buildSimulation(scenarioType: ScenarioType, operator: NonNullable<AuthRequest["sessionUser"]>) {
  const meta = SCENARIO_META[scenarioType];

  const [allSites, allPersons, recentAlerts, latestMetrics] = await Promise.all([
    db.select().from(sitesTable),
    db.select().from(protectedPersonsTable),
    db
      .select()
      .from(unifiedAlertsTable)
      .where(eq(unifiedAlertsTable.status, "active"))
      .orderBy(desc(unifiedAlertsTable.createdAt))
      .limit(20),
    db.select().from(energyMetricsTable).orderBy(desc(energyMetricsTable.recordedAt)).limit(50),
  ]);

  const affectedSites = allSites
    .filter(
      (s) =>
        meta.siteTypesAffected.includes(s.type) ||
        s.currentRiskLevel === "critical" ||
        s.currentRiskLevel === "high"
    )
    .slice(0, 5);

  const affectedSiteIds = new Set(affectedSites.map((s) => s.id));
  const affectedPersons = allPersons.filter((p) => affectedSiteIds.has(p.siteId));
  const atRiskPersons = affectedPersons.filter((p) => p.status === "at-risk" || p.status === "emergency");
  const criticalFacilities = affectedSites.filter((s) => s.type === "clinic" || s.type === "shelter");

  const relevantMetrics = latestMetrics.filter((m) => affectedSiteIds.has(m.siteId));
  const avgBattery =
    relevantMetrics.length > 0
      ? relevantMetrics.reduce((sum, m) => sum + m.batteryLevel, 0) / relevantMetrics.length
      : 65;
  const avgSolar =
    relevantMetrics.length > 0
      ? relevantMetrics.reduce((sum, m) => sum + m.solarGeneration, 0) / relevantMetrics.length
      : 45;

  const baseReadiness = 100 - meta.readinessPenalty;
  const batteryPenalty = avgBattery < 30 ? 15 : avgBattery < 60 ? 5 : 0;
  const criticalPenalty = criticalFacilities.length * 3;
  const readinessScore = Math.max(20, Math.min(99, baseReadiness - batteryPenalty - criticalPenalty));
  const estimatedPopulationAtRisk = affectedSites.reduce((sum, s) => sum + s.population, 0);
  const backupHoursEstimate = avgBattery > 0 ? Math.round((avgBattery / 100) * 12) : 0;

  const threatScore = Math.max(
    25,
    Math.min(
      100,
      Math.round(
        (100 - readinessScore) * 0.55 +
          (meta.baseRisk === "critical" ? 22 : meta.baseRisk === "warning" ? 12 : 5) +
          atRiskPersons.length * 4 +
          criticalFacilities.length * 6
      )
    )
  );

  const autoEscalation = buildAutoEscalation({
    threatScore,
    riskSeverity: meta.baseRisk,
    triggerModule: meta.module,
    affectedSitesCount: affectedSites.length,
    atRiskPersonsCount: atRiskPersons.length,
    criticalFacilitiesCount: criticalFacilities.length,
    estimatedPopulationAtRisk,
  });

  const autoResponse = buildAutoResponse({
    triggerModule: meta.module,
    threatScore,
    escalationLevel: autoEscalation.escalationLevel,
    deploymentMode: autoEscalation.deploymentMode,
    affectedSitesCount: affectedSites.length,
    atRiskPersonsCount: atRiskPersons.length,
    estimatedPopulationAtRisk,
  });

  const scenarioId = `SIM-${Date.now()}`;

  return {
    scenarioId,
    scenarioType,
    scenarioLabel: meta.label,
    triggerModule: meta.module,
    riskSeverity: meta.baseRisk,
    readinessScore,
    threatScore,
    operator: {
      email: operator.email,
      name: operator.name,
      role: operator.role,
    },
    affectedSites: affectedSites.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      location: s.location,
      country: s.country,
      status: s.status,
      population: s.population,
      powerAvailability: s.powerAvailability,
      currentRiskLevel: s.currentRiskLevel,
    })),
    affectedPersonsTotal: affectedPersons.length,
    atRiskPersonsCount: atRiskPersons.length,
    criticalFacilitiesCount: criticalFacilities.length,
    criticalFacilities: criticalFacilities.map((f) => ({
      id: f.id,
      name: f.name,
      type: f.type,
      location: f.location,
    })),
    estimatedPopulationAtRisk,
    energyStatus: {
      avgBatteryLevel: Math.round(avgBattery),
      avgSolarGeneration: Math.round(avgSolar),
      backupHoursEstimate,
      gridStressLevel: avgBattery < 30 ? "critical" : avgBattery < 60 ? "warning" : "stable",
    },
    recommendedActions: meta.actions,
    escalationTimeline: meta.timelineEvents,
    activeAlertCount: recentAlerts.filter((a) => a.module === meta.module).length,
    autoEscalation,
    autoResponse,
    simulatedAt: new Date().toISOString(),
  };
}

router.get("/command-center/history", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(simulationHistoryTable)
      .orderBy(desc(simulationHistoryTable.simulatedAt))
      .limit(20);

    return res.json(
      rows.map((r) => ({
        id: r.id,
        scenarioId: r.scenarioId,
        scenarioType: r.scenarioType,
        scenarioLabel: r.scenarioLabel,
        operatorEmail: r.operatorEmail,
        operatorName: r.operatorName,
        operatorRole: r.operatorRole,
        riskSeverity: r.riskSeverity,
        readinessScore: Math.round(r.readinessScore),
        affectedSites: r.affectedSitesCount,
        affectedPersons: r.affectedPersonsCount,
        estimatedPopulationAtRisk: r.estimatedPopulationAtRisk,
        simulatedAt: r.simulatedAt.toISOString(),
      }))
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/command-center/history/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const rows = await db.select().from(simulationHistoryTable).where(eq(simulationHistoryTable.id, id)).limit(1);
    const row = rows[0];

    if (!row) {
      return res.status(404).json({ error: "Simulation not found" });
    }

    let result: unknown = {};
    try {
      result = JSON.parse(row.resultJson);
    } catch {
      result = {};
    }

    return res.json({ result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/command-center/escalations", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(escalationEventsTable)
      .orderBy(desc(escalationEventsTable.createdAt))
      .limit(20);

    return res.json(
      rows.map((row) => ({
        id: row.id,
        scenarioId: row.scenarioId,
        scenarioType: row.scenarioType,
        scenarioLabel: row.scenarioLabel,
        triggerModule: row.triggerModule,
        threatScore: Number(row.threatScore),
        escalationLevel: row.escalationLevel,
        deploymentMode: row.deploymentMode,
        operatingProtocol: row.operatingProtocol,
        operatorDirective: row.operatorDirective,
        recommendedTeams: JSON.parse(row.recommendedTeamsJson),
        recommendedActions: JSON.parse(row.recommendedActionsJson),
        actorEmail: row.actorEmail,
        actorName: row.actorName,
        actorRole: row.actorRole,
        createdAt: row.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/command-center/simulate", async (req: AuthRequest, res) => {
  try {
    const { scenarioType, item } = req.body as { scenarioType?: string; item?: QueueItemPayload };
    const operator = req.sessionUser;

    if (!operator) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const resolvedScenarioType =
      scenarioType && (VALID_SCENARIOS as readonly string[]).includes(scenarioType)
        ? (scenarioType as ScenarioType)
        : deriveScenarioFromItem(item);

    const result = await buildSimulation(resolvedScenarioType, operator);

    const [saved] = await db
      .insert(simulationHistoryTable)
      .values({
        scenarioId: result.scenarioId,
        scenarioType: result.scenarioType,
        scenarioLabel: result.scenarioLabel,
        operatorEmail: operator.email,
        operatorName: operator.name,
        operatorRole: operator.role,
        riskSeverity: result.riskSeverity,
        readinessScore: result.readinessScore,
        affectedSitesCount: result.affectedSites.length,
        affectedPersonsCount: result.affectedPersonsTotal,
        estimatedPopulationAtRisk: result.estimatedPopulationAtRisk,
        resultJson: JSON.stringify(result),
      })
      .returning();

    await db.insert(auditLogTable).values({
      actor: operator.email,
      action: "command_center_simulation",
      details: JSON.stringify({
        scenarioId: result.scenarioId,
        scenarioType: result.scenarioType,
        simulationId: String(saved.id),
        threatScore: result.threatScore,
        escalationLevel: result.autoEscalation.escalationLevel,
        deploymentMode: result.autoEscalation.deploymentMode,
        connectedClients: getLiveClientCount(),
      }),
    });

    await db.insert(escalationEventsTable).values({
      scenarioId: result.scenarioId,
      scenarioType: result.scenarioType,
      scenarioLabel: result.scenarioLabel,
      triggerModule: result.triggerModule,
      threatScore: String(result.threatScore),
      escalationLevel: result.autoEscalation.escalationLevel,
      deploymentMode: result.autoEscalation.deploymentMode,
      operatingProtocol: result.autoEscalation.operatingProtocol,
      operatorDirective: result.autoEscalation.operatorDirective,
      recommendedTeamsJson: JSON.stringify(result.autoEscalation.recommendedTeams),
      recommendedActionsJson: JSON.stringify(result.autoEscalation.recommendedActions),
      actorEmail: operator.email,
      actorName: operator.name,
      actorRole: operator.role,
    });

    const livePayload = makeLivePayload(
      "command-center:auto-escalation",
      `${result.scenarioLabel} simulation triggered ${result.autoEscalation.escalationLevel} escalation`,
      {
        scenarioId: result.scenarioId,
        scenarioType: result.scenarioType,
        threatScore: result.threatScore,
        escalationLevel: result.autoEscalation.escalationLevel,
        deploymentMode: result.autoEscalation.deploymentMode,
        operatingProtocol: result.autoEscalation.operatingProtocol,
        connectedClients: getLiveClientCount(),
      }
    );

    broadcastLiveEvent("map-update", livePayload);

    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/command-center/orchestrate", async (req: AuthRequest, res) => {
  try {
    const { action, item, scenarioType } = req.body as {
      action?: ConsoleAction;
      item?: QueueItemPayload;
      scenarioType?: string;
    };

    const operator = req.sessionUser;

    if (!operator) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!action || !["recommend", "escalate", "dispatch"].includes(action)) {
      return res.status(400).json({ error: "Invalid action" });
    }

    if (!validateQueueItem(item)) {
      return res.status(400).json({ error: "Invalid queue item payload" });
    }

    const resolvedScenarioType =
      scenarioType && (VALID_SCENARIOS as readonly string[]).includes(scenarioType)
        ? (scenarioType as ScenarioType)
        : deriveScenarioFromItem(item);

    const simulation = await buildSimulation(resolvedScenarioType, operator);

    const actionMessage =
      action === "recommend"
        ? simulation.autoEscalation.operatorDirective ||
          item.recommendedAction ||
          `AI recommendation issued for ${item.title}.`
        : action === "escalate"
          ? `Escalation confirmed → ${simulation.autoEscalation.escalationLevel} / ${simulation.autoEscalation.deploymentMode}`
          : `Dispatch initiated → ${simulation.autoEscalation.recommendedActions?.[0] || `Response units assigned to ${item.title}.`}`;

    await db.insert(auditLogTable).values({
      actor: operator.email,
      action: `command_center_${action}`,
      details: JSON.stringify({
        scenarioId: simulation.scenarioId,
        scenarioType: simulation.scenarioType,
        targetKind: item.kind,
        targetId: item.id,
        targetTitle: item.title,
        threatScore: simulation.threatScore,
        escalationLevel: simulation.autoEscalation.escalationLevel,
        deploymentMode: simulation.autoEscalation.deploymentMode,
      }),
    });

    if (action !== "recommend") {
      await db.insert(escalationEventsTable).values({
        scenarioId: simulation.scenarioId,
        scenarioType: simulation.scenarioType,
        scenarioLabel: simulation.scenarioLabel,
        triggerModule: simulation.triggerModule,
        threatScore: String(simulation.threatScore),
        escalationLevel: simulation.autoEscalation.escalationLevel,
        deploymentMode: simulation.autoEscalation.deploymentMode,
        operatingProtocol: simulation.autoEscalation.operatingProtocol,
        operatorDirective: actionMessage,
        recommendedTeamsJson: JSON.stringify(simulation.autoEscalation.recommendedTeams),
        recommendedActionsJson: JSON.stringify(simulation.autoEscalation.recommendedActions),
        actorEmail: operator.email,
        actorName: operator.name,
        actorRole: operator.role,
      });
    }

    const livePayload = makeLivePayload(
      `command-center:${action}`,
      `${operator.name || operator.email} executed ${action} on ${item.title}`,
      {
        action,
        scenarioId: simulation.scenarioId,
        scenarioType: simulation.scenarioType,
        scenarioLabel: simulation.scenarioLabel,
        targetKind: item.kind,
        targetId: item.id,
        targetTitle: item.title,
        location: item.location,
        threatScore: simulation.threatScore,
        escalationLevel: simulation.autoEscalation.escalationLevel,
        deploymentMode: simulation.autoEscalation.deploymentMode,
        connectedClients: getLiveClientCount(),
      }
    );

    broadcastLiveEvent("map-update", livePayload);

    return res.json({
      ok: true,
      action,
      scenarioId: simulation.scenarioId,
      scenarioType: simulation.scenarioType,
      scenarioLabel: simulation.scenarioLabel,
      target: item,
      threatScore: simulation.threatScore,
      escalationLevel: simulation.autoEscalation.escalationLevel,
      deploymentMode: simulation.autoEscalation.deploymentMode,
      operatorDirective: simulation.autoEscalation.operatorDirective,
      recommendedActions: simulation.autoEscalation.recommendedActions,
      message: actionMessage,
      executedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

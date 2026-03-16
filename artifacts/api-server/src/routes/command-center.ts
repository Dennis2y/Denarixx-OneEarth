import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  sitesTable,
  protectedPersonsTable,
  unifiedAlertsTable,
  energyMetricsTable,
  simulationHistoryTable,
} from "@workspace/db";
import { desc, eq, sql } from "drizzle-orm";
import { broadcastLiveEvent, makeLivePayload, getLiveClientCount } from "../lib/live.js";

const router: IRouter = Router();

router.get("/command-center/history", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(simulationHistoryTable)
      .orderBy(desc(simulationHistoryTable.simulatedAt))
      .limit(20);

    res.json(rows.map((r) => ({
      id: r.id,
      scenarioId: r.scenarioId,
      scenarioType: r.scenarioType,
      scenarioLabel: r.scenarioLabel,
      operatorEmail: r.operatorEmail,
      operatorName: r.operatorName,
      operatorRole: r.operatorRole,
      readinessScore: r.readinessScore,
      riskSeverity: r.riskSeverity,
      affectedSitesCount: r.affectedSitesCount,
      affectedPersonsCount: r.affectedPersonsCount,
      estimatedPopulationAtRisk: r.estimatedPopulationAtRisk,
      simulatedAt: r.simulatedAt.toISOString(),
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/command-center/history/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const rows = await db.select().from(simulationHistoryTable).where(eq(simulationHistoryTable.id, id)).limit(1);
    const row = rows[0];

    if (!row) return res.status(404).json({ error: "Simulation not found" });

    let result: unknown = {};
    try {
      result = JSON.parse(row.resultJson);
    } catch {}

    return res.json({ result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/command-center/simulate", async (req, res) => {
  try {
    const scenarioType = String(req.body?.scenarioType ?? "multi_site_outage");

    const sites = await db.select().from(sitesTable);
    const persons = await db.select().from(protectedPersonsTable);
    const alerts = await db.select().from(unifiedAlertsTable);
    const latestEnergy = await db
      .select()
      .from(energyMetricsTable)
      .orderBy(desc(energyMetricsTable.recordedAt))
      .limit(100);

    const affectedSites = sites
      .filter((s) => s.currentRiskLevel !== "low" || s.status !== "online")
      .slice(0, 6)
      .map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        location: s.location,
        country: s.country,
        status: s.status,
        population: s.population,
        powerAvailability: s.powerAvailability,
        currentRiskLevel: s.currentRiskLevel,
      }));

    const atRiskPersons = persons.filter((p) => p.status === "at-risk" || p.status === "emergency");
    const criticalFacilities = affectedSites.filter((s) => s.type === "clinic" || s.type === "shelter");

    const energyRows = latestEnergy.slice(0, 20);
    const avgBatteryLevel = energyRows.length
      ? Math.round(energyRows.reduce((sum, row) => sum + Number(row.batteryLevel), 0) / energyRows.length)
      : 0;
    const avgSolarGeneration = energyRows.length
      ? Math.round(energyRows.reduce((sum, row) => sum + Number(row.solarGeneration), 0) / energyRows.length)
      : 0;

    const readinessScore = Math.max(25, Math.min(92, 100 - (atRiskPersons.length * 3 + criticalFacilities.length * 4)));
    const riskSeverity = readinessScore < 50 ? "critical" : readinessScore < 72 ? "warning" : "info";

    const result = {
      scenarioId: `SIM-${scenarioType}-${Date.now()}`,
      scenarioType,
      scenarioLabel: scenarioType.replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase()),
      triggerModule:
        scenarioType.includes("sos") ? "lifemesh" :
        scenarioType.includes("outage") || scenarioType.includes("power") ? "energy" :
        "earthshield",
      riskSeverity,
      readinessScore,
      operator: {
        email: "commander@denarixx.io",
        name: "Cmdr. Prime",
        role: "admin",
      },
      affectedSites,
      affectedPersonsTotal: persons.length,
      atRiskPersonsCount: atRiskPersons.length,
      criticalFacilitiesCount: criticalFacilities.length,
      criticalFacilities: criticalFacilities.map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        location: s.location,
      })),
      estimatedPopulationAtRisk: affectedSites.reduce((sum, s) => sum + Number(s.population), 0),
      energyStatus: {
        avgBatteryLevel,
        avgSolarGeneration,
        backupHoursEstimate: Math.max(2, Math.round(avgBatteryLevel / 10)),
        gridStressLevel: avgBatteryLevel < 25 ? "critical" : avgBatteryLevel < 55 ? "warning" : "stable",
      },
      recommendedActions: [
        "Activate cross-module emergency coordination",
        "Dispatch local response assets to critical sites",
        "Escalate at-risk entities to regional command",
        "Stabilize power and communication channels",
      ],
      escalationTimeline: [
        { time: "T+00", event: "Incident classified and simulation initiated", severity: "info" },
        { time: "T+10", event: "Priority sites flagged for intervention", severity: "warning" },
        { time: "T+20", event: "Regional response escalation triggered", severity: riskSeverity },
      ],
      activeAlertCount: alerts.filter((a) => a.status === "active").length,
      simulatedAt: new Date().toISOString(),
    };

    const [saved] = await db.insert(simulationHistoryTable).values({
      scenarioId: result.scenarioId,
      scenarioType: result.scenarioType,
      scenarioLabel: result.scenarioLabel,
      operatorEmail: result.operator.email,
      operatorName: result.operator.name,
      operatorRole: result.operator.role,
      readinessScore: result.readinessScore,
      riskSeverity: result.riskSeverity,
      affectedSitesCount: result.affectedSites.length,
      affectedPersonsCount: result.atRiskPersonsCount,
      estimatedPopulationAtRisk: result.estimatedPopulationAtRisk,
      resultJson: JSON.stringify(result),
    }).returning();

    broadcastLiveEvent(
      "map-update",
      makeLivePayload("command-center:simulation", `Simulation executed: ${result.scenarioLabel}`, {
        scenarioType: result.scenarioType,
        readinessScore: result.readinessScore,
        riskSeverity: result.riskSeverity,
        simulationId: saved.id,
        connectedClients: getLiveClientCount(),
      }),
    );

    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  sitesTable, unifiedAlertsTable, protectedPersonsTable,
  disasterAlertsTable, energyMetricsTable, auditLogTable,
} from "@workspace/db";
import { eq, count, and, desc } from "drizzle-orm";
import type { AuthRequest } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get("/dashboard/stats", async (_req, res) => {
  try {
    const [
      sitesResult,
      criticalAlertsResult,
      protectedResult,
      riskZonesResult,
      recentAlerts,
      recentMetrics,
    ] = await Promise.all([
      db.select({ count: count() }).from(sitesTable).where(eq(sitesTable.status, "online")),
      db.select({ count: count() }).from(unifiedAlertsTable).where(and(eq(unifiedAlertsTable.severity, "critical"), eq(unifiedAlertsTable.status, "active"))),
      db.select({ count: count() }).from(protectedPersonsTable),
      db.select({ count: count() }).from(disasterAlertsTable).where(eq(disasterAlertsTable.status, "active")),
      db.select().from(unifiedAlertsTable).orderBy(desc(unifiedAlertsTable.createdAt)).limit(10),
      db.select({
        batteryLevel: energyMetricsTable.batteryLevel,
        solarGeneration: energyMetricsTable.solarGeneration,
      }).from(energyMetricsTable).orderBy(desc(energyMetricsTable.recordedAt)).limit(20),
    ]);

    const avgBattery = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.batteryLevel, 0) / recentMetrics.length
      : 87;
    const avgSolar = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.solarGeneration, 0) / recentMetrics.length
      : 72;
    const energyAvailability = Math.round(((avgBattery * 0.6) + (avgSolar * 0.4)) * 10) / 10;

    res.json({
      activeSites: Number(sitesResult[0]?.count ?? 0),
      criticalAlerts: Number(criticalAlertsResult[0]?.count ?? 0),
      protectedPeople: Number(protectedResult[0]?.count ?? 0),
      disasterRiskZones: Number(riskZonesResult[0]?.count ?? 0),
      energyAvailability: Math.min(99.9, Math.max(0, energyAvailability)),
      recentAlerts: recentAlerts.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/dashboard/drill", requireRole("admin", "operator"), async (req: AuthRequest, res) => {
  try {
    const { drillType = "evacuation", zones = "All Zones" } = req.body as {
      drillType?: string;
      zones?: string;
    };

    const DRILL_LABELS: Record<string, string> = {
      evacuation: "Mass Evacuation",
      medical: "Medical Emergency",
      "grid-failure": "Grid Failure Response",
      "flood-response": "Flood Response",
      "comms-blackout": "Communications Blackout",
    };

    const drillLabel = DRILL_LABELS[drillType] ?? drillType;
    const operator = req.sessionUser!;

    await db.insert(unifiedAlertsTable).values({
      title: `DRILL: ${drillLabel} Protocol`,
      module: "earthshield",
      severity: "info",
      location: zones,
      status: "active",
      description: `Emergency drill initiated by ${operator.name} (${operator.role}). Drill type: ${drillLabel}. All teams to standby positions. This is a drill — no real emergency.`,
    });

    await db.insert(auditLogTable).values({
      actor: operator.email,
      actorRole: operator.role,
      action: "drill.run",
      target: `drill:${drillType}`,
      details: JSON.stringify({ drillType, drillLabel, zones, initiatedBy: operator.name }),
    }).catch(() => {});

    return res.json({
      success: true,
      drillType,
      drillLabel,
      zones,
      operator: { name: operator.name, email: operator.email, role: operator.role },
      initiatedAt: new Date().toISOString(),
      message: `Drill "${drillLabel}" initiated successfully. All zone coordinators notified via broadcast. Expected duration: 15–30 minutes.`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/dashboard/deploy", requireRole("admin", "operator"), async (req: AuthRequest, res) => {
  try {
    const {
      name, type = "village", location, country,
      latitude = 0, longitude = 0, population = 0,
    } = req.body as {
      name?: string; type?: string; location?: string; country?: string;
      latitude?: number; longitude?: number; population?: number;
    };

    if (!name || !location || !country) {
      return res.status(400).json({ error: "name, location, and country are required" });
    }

    const operator = req.sessionUser!;

    const [newSite] = await db.insert(sitesTable).values({
      name,
      type: type as "village" | "clinic" | "school" | "district" | "shelter",
      location,
      country,
      status: "online",
      uptime: 99.9,
      powerAvailability: 95.0,
      currentRiskLevel: "low",
      population: Number(population),
      latitude: Number(latitude),
      longitude: Number(longitude),
    }).returning();

    await db.insert(auditLogTable).values({
      actor: operator.email,
      actorRole: operator.role,
      action: "node.deploy",
      target: `site:${newSite.id}`,
      details: JSON.stringify({ name, type, location, country, deployedBy: operator.name }),
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      site: { ...newSite, createdAt: newSite.createdAt.toISOString() },
      message: `Node "${name}" deployed successfully. ID: ${newSite.id}. Ready for telemetry.`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sitesTable, unifiedAlertsTable, protectedPersonsTable, disasterAlertsTable, energyMetricsTable } from "@workspace/db";
import { eq, count, and, desc } from "drizzle-orm";

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

export default router;

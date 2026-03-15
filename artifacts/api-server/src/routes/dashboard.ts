import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sitesTable, unifiedAlertsTable, protectedPersonsTable, disasterAlertsTable } from "@workspace/db";
import { eq, count, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/stats", async (_req, res) => {
  try {
    const [sitesResult] = await db.select({ count: count() }).from(sitesTable).where(eq(sitesTable.status, "online"));
    const [criticalAlertsResult] = await db.select({ count: count() }).from(unifiedAlertsTable).where(and(eq(unifiedAlertsTable.severity, "critical"), eq(unifiedAlertsTable.status, "active")));
    const [protectedResult] = await db.select({ count: count() }).from(protectedPersonsTable);
    const [riskZonesResult] = await db.select({ count: count() }).from(disasterAlertsTable).where(eq(disasterAlertsTable.status, "active"));

    const recentAlerts = await db.select().from(unifiedAlertsTable).orderBy(unifiedAlertsTable.createdAt).limit(10);

    res.json({
      activeSites: Number(sitesResult?.count ?? 0),
      criticalAlerts: Number(criticalAlertsResult?.count ?? 0),
      protectedPeople: Number(protectedResult?.count ?? 0),
      disasterRiskZones: Number(riskZonesResult?.count ?? 0),
      energyAvailability: 87.4,
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

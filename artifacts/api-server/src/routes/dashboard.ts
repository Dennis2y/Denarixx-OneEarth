import { Router } from "express";
import { db } from "@workspace/db";
import {
  sitesTable,
  unifiedAlertsTable,
  protectedPersonsTable,
  energyMetricsTable,
  disasterAlertsTable,
} from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { scoreAlert, scoreSite } from "../lib/threat-score.js";

const router = Router();

router.get("/dashboard/stats", async (_req, res) => {
  try {
    const [sites, alerts, persons, disasters] = await Promise.all([
      db.select().from(sitesTable).orderBy(sitesTable.name),
      db.select().from(unifiedAlertsTable)
        .where(eq(unifiedAlertsTable.status, "active"))
        .orderBy(desc(unifiedAlertsTable.createdAt)),
      db.select().from(protectedPersonsTable),
      db.select().from(disasterAlertsTable).orderBy(desc(disasterAlertsTable.issuedAt)).limit(12),
    ]);

    const latestEnergyRows = await Promise.all(
      sites.map(async (site) => {
        const [latest] = await db.select().from(energyMetricsTable)
          .where(eq(energyMetricsTable.siteId, site.id))
          .orderBy(desc(energyMetricsTable.recordedAt))
          .limit(1);

        return {
          siteId: site.id,
          latestEnergy: latest
            ? {
                solarGeneration: latest.solarGeneration,
                batteryLevel: latest.batteryLevel,
                communityLoad: latest.communityLoad,
                gridStatus: latest.gridStatus,
                uptime: latest.uptime,
                recordedAt: latest.recordedAt.toISOString(),
              }
            : null,
        };
      })
    );

    const energyBySite = new Map(latestEnergyRows.map((row) => [row.siteId, row.latestEnergy]));

    const scoredAlerts = alerts.map((a) => ({
      id: a.id,
      title: a.title,
      module: a.module,
      severity: a.severity,
      status: a.status,
      location: a.location,
      description: a.description,
      createdAt: a.createdAt.toISOString(),
      ...scoreAlert({
        title: a.title,
        severity: a.severity,
        module: a.module,
        location: a.location,
        description: a.description ?? "",
      }),
    }));

    const scoredSites = sites.map((site) => {
      const latestEnergy = energyBySite.get(site.id) ?? null;

      return {
        id: site.id,
        name: site.name,
        type: site.type,
        location: site.location,
        country: site.country,
        status: site.status,
        currentRiskLevel: site.currentRiskLevel,
        powerAvailability: site.powerAvailability,
        population: site.population,
        latitude: site.latitude,
        longitude: site.longitude,
        latestEnergy,
        ...scoreSite({
          name: site.name,
          type: site.type,
          status: site.status,
          currentRiskLevel: site.currentRiskLevel,
          population: site.population,
          powerAvailability: site.powerAvailability,
          country: site.country,
        }),
      };
    });

    const criticalAlerts = scoredAlerts.filter((a) => a.severity === "critical").length;
    const criticalThreatSites = scoredSites.filter((s) => s.threatLevel === "critical").length;
    const averageThreatScore = scoredSites.length
      ? Math.round(scoredSites.reduce((sum, s) => sum + s.threatScore, 0) / scoredSites.length)
      : 0;

    const protectedPeople = persons.length;
    const atRiskPeople = persons.filter((p) => p.status === "at-risk" || p.status === "emergency").length;

    const energyAvailability = scoredSites.length
      ? scoredSites.reduce((sum, s) => sum + Number(s.powerAvailability ?? 0), 0) / scoredSites.length
      : 0;

    const activeSites = scoredSites.length;

    const topThreatSites = [...scoredSites]
      .sort((a, b) => b.threatScore - a.threatScore)
      .slice(0, 5);

    const urgentQueue = [
      ...scoredAlerts
        .filter((a) => a.responsePriority === "immediate" || a.responsePriority === "urgent")
        .map((a) => ({
          kind: "alert",
          id: a.id,
          title: a.title,
          location: a.location,
          threatScore: a.threatScore,
          threatLevel: a.threatLevel,
          responsePriority: a.responsePriority,
          recommendedAction: a.recommendedAction,
        })),
      ...scoredSites
        .filter((s) => s.responsePriority === "immediate" || s.responsePriority === "urgent")
        .map((s) => ({
          kind: "site",
          id: s.id,
          title: s.name,
          location: `${s.location}, ${s.country}`,
          threatScore: s.threatScore,
          threatLevel: s.threatLevel,
          responsePriority: s.responsePriority,
          recommendedAction: s.recommendedAction,
        })),
    ]
      .sort((a, b) => b.threatScore - a.threatScore)
      .slice(0, 8);

    const recentAlerts = scoredAlerts.slice(0, 10);

    return res.json({
      totalSites: activeSites,
      activeSites,
      activeAlerts: scoredAlerts.length,
      criticalAlerts,
      protectedPeople,
      protectedPersons: protectedPeople,
      atRiskPeople,
      energyAvailability: Number(energyAvailability.toFixed(1)),
      disasterAlerts: disasters.length,
      criticalThreatSites,
      averageThreatScore,
      topThreatSites,
      urgentQueue,
      recentAlerts,
      globeSites: scoredSites,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

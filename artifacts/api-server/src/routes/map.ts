import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  sitesTable,
  energyMetricsTable,
  unifiedAlertsTable,
  protectedPersonsTable,
  disasterAlertsTable,
  riskZonesTable,
} from "@workspace/db";
import { desc, eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/map/overview", async (_req, res) => {
  try {
    const [sites, activeAlerts, persons, disasterAlerts, riskZones] = await Promise.all([
      db.select().from(sitesTable).orderBy(sitesTable.name),
      db.select().from(unifiedAlertsTable)
        .where(eq(unifiedAlertsTable.status, "active"))
        .orderBy(desc(unifiedAlertsTable.createdAt)),
      db.select().from(protectedPersonsTable),
      db.select().from(disasterAlertsTable).orderBy(desc(disasterAlertsTable.issuedAt)),
      db.select().from(riskZonesTable).orderBy(riskZonesTable.name),
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

    const siteCards = sites.map((site) => {
      const latestEnergy = energyBySite.get(site.id) ?? null;

      const sitePersons = persons.filter((p) => p.siteId === site.id);
      const atRiskPersons = sitePersons.filter((p) => p.status === "at-risk" || p.status === "emergency").length;

      const locationLower = (site.location ?? "").toLowerCase();
      const nameLower = (site.name ?? "").toLowerCase();

      const siteAlerts = activeAlerts.filter((a) =>
        (a.location ?? "").toLowerCase().includes(locationLower) ||
        (a.location ?? "").toLowerCase().includes(nameLower) ||
        (a.description ?? "").toLowerCase().includes(nameLower)
      );

      const criticalAlerts = siteAlerts.filter((a) => a.severity === "critical").length;

      return {
        id: site.id,
        name: site.name,
        type: site.type,
        location: site.location,
        country: site.country,
        status: site.status,
        currentRiskLevel: site.currentRiskLevel,
        powerAvailability: site.powerAvailability,
        uptime: site.uptime,
        population: site.population,
        latitude: site.latitude,
        longitude: site.longitude,
        createdAt: site.createdAt.toISOString(),
        latestEnergy,
        activeAlertsCount: siteAlerts.length,
        criticalAlertsCount: criticalAlerts,
        protectedPersonsCount: sitePersons.length,
        atRiskPersonsCount: atRiskPersons,
      };
    });

    const alertsPayload = activeAlerts.map((a) => ({
      id: a.id,
      title: a.title,
      module: a.module,
      severity: a.severity,
      status: a.status,
      location: a.location,
      description: a.description,
      createdAt: a.createdAt.toISOString(),
    }));

    const personsPayload = persons.map((p) => ({
      id: p.id,
      name: p.name,
      age: p.age,
      category: p.category,
      status: p.status,
      lastKnownLocation: p.lastKnownLocation,
      contactName: p.contactName,
      contactPhone: p.contactPhone,
      siteId: p.siteId,
      notes: p.notes ?? null,
      updatedAt: p.updatedAt.toISOString(),
    }));

    const disastersPayload = disasterAlerts.map((d) => ({
      id: d.id,
      type: d.type,
      title: d.title,
      description: d.description,
      severity: d.severity,
      region: d.region,
      country: d.country,
      status: d.status,
      affectedPopulation: d.affectedPopulation,
      issuedAt: d.issuedAt.toISOString(),
    }));

    const risksPayload = riskZones.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      country: r.country,
      region: r.region,
      riskLevel: r.riskLevel,
      preparednessScore: r.preparednessScore,
      latitude: r.latitude,
      longitude: r.longitude,
    }));

    const summary = {
      sites: siteCards.length,
      activeAlerts: alertsPayload.length,
      criticalAlerts: alertsPayload.filter((a) => a.severity === "critical").length,
      protectedPersons: personsPayload.length,
      atRiskPersons: personsPayload.filter((p) => p.status === "at-risk" || p.status === "emergency").length,
      disasterAlerts: disastersPayload.length,
      riskZones: risksPayload.length,
    };

    return res.json({
      summary,
      sites: siteCards,
      alerts: alertsPayload,
      persons: personsPayload,
      disasterAlerts: disastersPayload,
      riskZones: risksPayload,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

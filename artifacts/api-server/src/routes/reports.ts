import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  sitesTable, energyMetricsTable, unifiedAlertsTable,
  protectedPersonsTable, simulationHistoryTable, auditLogTable,
  disasterAlertsTable,
} from "@workspace/db";
import { eq, desc, and, count } from "drizzle-orm";
import type { AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

router.post("/reports/site/:id", async (req: AuthRequest, res) => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId ?? "", 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid site ID" });

    const [site] = await db.select().from(sitesTable).where(eq(sitesTable.id, id));
    if (!site) return res.status(404).json({ error: "Site not found" });

    const [energyHistory, alerts, persons] = await Promise.all([
      db.select().from(energyMetricsTable)
        .where(eq(energyMetricsTable.siteId, id))
        .orderBy(desc(energyMetricsTable.recordedAt))
        .limit(48),
      db.select().from(unifiedAlertsTable)
        .orderBy(desc(unifiedAlertsTable.createdAt))
        .limit(20),
      db.select().from(protectedPersonsTable)
        .where(eq(protectedPersonsTable.siteId, id)),
    ]);

    const avgBattery = energyHistory.length > 0
      ? energyHistory.reduce((s, m) => s + m.batteryLevel, 0) / energyHistory.length : 0;
    const avgSolar = energyHistory.length > 0
      ? energyHistory.reduce((s, m) => s + m.solarGeneration, 0) / energyHistory.length : 0;

    const operator = req.sessionUser!;
    const report = {
      reportType: "site_resilience",
      reportId: `RPT-SITE-${id}-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      generatedBy: { email: operator.email, name: operator.name, role: operator.role },
      platform: "Denarixx OneEarth",
      site: {
        id: site.id,
        name: site.name,
        type: site.type,
        location: site.location,
        country: site.country,
        status: site.status,
        uptime: site.uptime,
        powerAvailability: site.powerAvailability,
        currentRiskLevel: site.currentRiskLevel,
        population: site.population,
        latitude: site.latitude,
        longitude: site.longitude,
      },
      energySummary: {
        avgBatteryLevel: Math.round(avgBattery * 10) / 10,
        avgSolarGeneration: Math.round(avgSolar * 10) / 10,
        dataPoints: energyHistory.length,
        latestReading: energyHistory[0] ? {
          batteryLevel: energyHistory[0].batteryLevel,
          solarGeneration: energyHistory[0].solarGeneration,
          gridStatus: energyHistory[0].gridStatus,
          recordedAt: energyHistory[0].recordedAt.toISOString(),
        } : null,
      },
      protectedPersons: {
        total: persons.length,
        byStatus: {
          safe: persons.filter(p => p.status === "safe").length,
          atRisk: persons.filter(p => p.status === "at-risk").length,
          emergency: persons.filter(p => p.status === "emergency").length,
          unknown: persons.filter(p => p.status === "unknown").length,
        },
        byCategory: {
          child: persons.filter(p => p.category === "child").length,
          elderly: persons.filter(p => p.category === "elderly").length,
          family: persons.filter(p => p.category === "family").length,
          vulnerable: persons.filter(p => p.category === "vulnerable").length,
        },
      },
      alerts: {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === "critical").length,
        warning: alerts.filter(a => a.severity === "warning").length,
        active: alerts.filter(a => a.status === "active").length,
        resolved: alerts.filter(a => a.status === "resolved").length,
        recent: alerts.slice(0, 5).map(a => ({
          title: a.title, severity: a.severity, module: a.module,
          status: a.status, createdAt: a.createdAt.toISOString(),
        })),
      },
    };

    await db.insert(auditLogTable).values({
      actor: operator.email,
      actorRole: operator.role,
      action: "report.generate",
      target: `site:${id}`,
      details: JSON.stringify({ reportType: "site_resilience", reportId: report.reportId }),
    }).catch(() => {});

    return res.json(report);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/reports/scenario/:historyId", async (req: AuthRequest, res) => {
  try {
    const rawHistoryId = Array.isArray(req.params.historyId) ? req.params.historyId[0] : req.params.historyId;
    const id = parseInt(rawHistoryId ?? "", 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const [record] = await db.select().from(simulationHistoryTable).where(eq(simulationHistoryTable.id, id));
    if (!record) return res.status(404).json({ error: "Simulation not found" });

    const operator = req.sessionUser!;
    const report = {
      reportType: "scenario_simulation",
      reportId: `RPT-SIM-${id}-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      generatedBy: { email: operator.email, name: operator.name, role: operator.role },
      platform: "Denarixx OneEarth",
      simulation: {
        ...record,
        simulatedAt: record.simulatedAt.toISOString(),
        fullResult: JSON.parse(record.resultJson),
      },
    };

    await db.insert(auditLogTable).values({
      actor: operator.email,
      actorRole: operator.role,
      action: "report.generate",
      target: `simulation:${record.scenarioId}`,
      details: JSON.stringify({ reportType: "scenario_simulation", scenarioLabel: record.scenarioLabel }),
    }).catch(() => {});

    return res.json(report);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/reports/alerts", async (req: AuthRequest, res) => {
  try {
    const operator = req.sessionUser!;

    const [allAlerts, disasterAlerts, [siteCount]] = await Promise.all([
      db.select().from(unifiedAlertsTable).orderBy(desc(unifiedAlertsTable.createdAt)).limit(100),
      db.select().from(disasterAlertsTable).orderBy(desc(disasterAlertsTable.issuedAt)).limit(50),
      db.select({ count: count() }).from(sitesTable).where(eq(sitesTable.status, "online")),
    ]);

    const report = {
      reportType: "alerts_summary",
      reportId: `RPT-ALERTS-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      generatedBy: { email: operator.email, name: operator.name, role: operator.role },
      platform: "Denarixx OneEarth",
      period: "Last 100 events",
      unifiedAlerts: {
        total: allAlerts.length,
        bySeverity: {
          critical: allAlerts.filter(a => a.severity === "critical").length,
          warning: allAlerts.filter(a => a.severity === "warning").length,
          info: allAlerts.filter(a => a.severity === "info").length,
        },
        byStatus: {
          active: allAlerts.filter(a => a.status === "active").length,
          acknowledged: allAlerts.filter(a => a.status === "acknowledged").length,
          resolved: allAlerts.filter(a => a.status === "resolved").length,
        },
        byModule: {
          energy: allAlerts.filter(a => a.module === "energy").length,
          lifemesh: allAlerts.filter(a => a.module === "lifemesh").length,
          earthshield: allAlerts.filter(a => a.module === "earthshield").length,
        },
        recent: allAlerts.slice(0, 10).map(a => ({
          title: a.title, severity: a.severity, module: a.module,
          status: a.status, location: a.location, createdAt: a.createdAt.toISOString(),
        })),
      },
      earthshieldAlerts: {
        total: disasterAlerts.length,
        bySeverity: {
          critical: disasterAlerts.filter(a => a.severity === "critical").length,
          warning: disasterAlerts.filter(a => a.severity === "warning").length,
          info: disasterAlerts.filter(a => a.severity === "info").length,
        },
        byType: {
          flood: disasterAlerts.filter(a => a.type === "flood").length,
          wildfire: disasterAlerts.filter(a => a.type === "wildfire").length,
          storm: disasterAlerts.filter(a => a.type === "storm").length,
          earthquake: disasterAlerts.filter(a => a.type === "earthquake").length,
          infrastructure: disasterAlerts.filter(a => a.type === "infrastructure").length,
          drought: disasterAlerts.filter(a => a.type === "drought").length,
        },
      },
      infrastructure: {
        onlineSites: Number(siteCount?.count ?? 0),
      },
    };

    await db.insert(auditLogTable).values({
      actor: operator.email,
      actorRole: operator.role,
      action: "report.generate",
      target: "alerts",
      details: JSON.stringify({ reportType: "alerts_summary", reportId: report.reportId }),
    }).catch(() => {});

    return res.json(report);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/reports/daily", async (req: AuthRequest, res) => {
  try {
    const operator = req.sessionUser!;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      allSites, allAlerts, allPersons, auditEntries,
      energySnapshot, disasterAlerts,
    ] = await Promise.all([
      db.select().from(sitesTable).orderBy(sitesTable.name),
      db.select().from(unifiedAlertsTable).orderBy(desc(unifiedAlertsTable.createdAt)).limit(50),
      db.select().from(protectedPersonsTable),
      db.select().from(auditLogTable).orderBy(desc(auditLogTable.createdAt)).limit(30),
      db.select({
        batteryLevel: energyMetricsTable.batteryLevel,
        solarGeneration: energyMetricsTable.solarGeneration,
        gridStatus: energyMetricsTable.gridStatus,
      }).from(energyMetricsTable).orderBy(desc(energyMetricsTable.recordedAt)).limit(40),
      db.select().from(disasterAlertsTable).where(eq(disasterAlertsTable.status, "active")),
    ]);

    const avgBattery = energySnapshot.length > 0
      ? energySnapshot.reduce((s, m) => s + m.batteryLevel, 0) / energySnapshot.length : 0;
    const avgSolar = energySnapshot.length > 0
      ? energySnapshot.reduce((s, m) => s + m.solarGeneration, 0) / energySnapshot.length : 0;

    const report = {
      reportType: "daily_operational",
      reportId: `RPT-DAILY-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      generatedBy: { email: operator.email, name: operator.name, role: operator.role },
      platform: "Denarixx OneEarth",
      reportDate: new Date().toISOString().split("T")[0],
      infrastructure: {
        totalSites: allSites.length,
        onlineSites: allSites.filter(s => s.status === "online").length,
        warningSites: allSites.filter(s => s.status === "warning").length,
        criticalSites: allSites.filter(s => s.status === "critical").length,
        offlineSites: allSites.filter(s => s.status === "offline").length,
        avgUptime: allSites.length > 0
          ? Math.round(allSites.reduce((s, site) => s + site.uptime, 0) / allSites.length * 10) / 10 : 0,
        avgPowerAvailability: allSites.length > 0
          ? Math.round(allSites.reduce((s, site) => s + site.powerAvailability, 0) / allSites.length * 10) / 10 : 0,
      },
      energy: {
        avgBatteryLevel: Math.round(avgBattery * 10) / 10,
        avgSolarGeneration: Math.round(avgSolar * 10) / 10,
        energyAvailability: Math.round(((avgBattery * 0.6) + (avgSolar * 0.4)) * 10) / 10,
        stableSites: energySnapshot.filter(e => e.gridStatus === "stable").length,
        unstableSites: energySnapshot.filter(e => e.gridStatus === "unstable").length,
        offlineSites: energySnapshot.filter(e => e.gridStatus === "offline").length,
      },
      lifeMesh: {
        totalProtected: allPersons.length,
        safe: allPersons.filter(p => p.status === "safe").length,
        atRisk: allPersons.filter(p => p.status === "at-risk").length,
        emergency: allPersons.filter(p => p.status === "emergency").length,
        unknown: allPersons.filter(p => p.status === "unknown").length,
        children: allPersons.filter(p => p.category === "child").length,
        elderly: allPersons.filter(p => p.category === "elderly").length,
      },
      alerts: {
        total: allAlerts.length,
        critical: allAlerts.filter(a => a.severity === "critical").length,
        warning: allAlerts.filter(a => a.severity === "warning").length,
        info: allAlerts.filter(a => a.severity === "info").length,
        active: allAlerts.filter(a => a.status === "active").length,
        acknowledged: allAlerts.filter(a => a.status === "acknowledged").length,
        resolved: allAlerts.filter(a => a.status === "resolved").length,
        recent10: allAlerts.slice(0, 10).map(a => ({
          title: a.title, severity: a.severity, module: a.module,
          status: a.status, location: a.location, createdAt: a.createdAt.toISOString(),
        })),
      },
      earthShield: {
        activeDisasterAlerts: disasterAlerts.length,
        criticalDisasters: disasterAlerts.filter(a => a.severity === "critical").length,
        affectedPopulation: disasterAlerts.reduce((s, a) => s + (a.affectedPopulation ?? 0), 0),
      },
      auditLog: auditEntries.slice(0, 20).map(e => ({
        actor: e.actor,
        actorRole: e.actorRole,
        action: e.action,
        target: e.target,
        createdAt: e.createdAt.toISOString(),
      })),
    };

    await db.insert(auditLogTable).values({
      actor: operator.email,
      actorRole: operator.role,
      action: "report.generate",
      target: "daily",
      details: JSON.stringify({ reportType: "daily_operational", reportId: report.reportId }),
    }).catch(() => {});

    return res.json(report);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

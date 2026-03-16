import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  sitesTable, insertSiteSchema, energyMetricsTable,
  unifiedAlertsTable, protectedPersonsTable, auditLogTable,
} from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import type { AuthRequest } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get("/sites", async (_req, res) => {
  try {
    const sites = await db.select().from(sitesTable).orderBy(sitesTable.name);
    return res.json(sites.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() })));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/sites/:id", async (req, res) => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId ?? "", 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid site ID" });

    const [site] = await db.select().from(sitesTable).where(eq(sitesTable.id, id));
    if (!site) return res.status(404).json({ error: "Site not found" });

    const [energyHistory, activeAlerts, persons] = await Promise.all([
      db.select().from(energyMetricsTable)
        .where(eq(energyMetricsTable.siteId, id))
        .orderBy(desc(energyMetricsTable.recordedAt))
        .limit(24),
      db.select().from(unifiedAlertsTable)
        .where(eq(unifiedAlertsTable.status, "active"))
        .orderBy(desc(unifiedAlertsTable.createdAt))
        .limit(10),
      db.select().from(protectedPersonsTable)
        .where(eq(protectedPersonsTable.siteId, id))
        .orderBy(protectedPersonsTable.name)
        .limit(50),
    ]);

    const latestMetric = energyHistory[0] ?? null;
    const atRiskCount = persons.filter(p => p.status === "at-risk" || p.status === "emergency").length;
    const criticalAlerts = activeAlerts.filter(a => a.severity === "critical").length;
    const riskScore = Math.min(100, Math.round(
      (site.currentRiskLevel === "critical" ? 80 : site.currentRiskLevel === "high" ? 60 : site.currentRiskLevel === "medium" ? 35 : 10) +
      (criticalAlerts * 5) + (atRiskCount * 2)
    ));

    return res.json({
      ...site,
      createdAt: site.createdAt.toISOString(),
      energyHistory: energyHistory.map(e => ({
        ...e,
        recordedAt: e.recordedAt.toISOString(),
      })),
      latestEnergy: latestMetric ? {
        solarGeneration: latestMetric.solarGeneration,
        batteryLevel: latestMetric.batteryLevel,
        communityLoad: latestMetric.communityLoad,
        gridStatus: latestMetric.gridStatus,
        uptime: latestMetric.uptime,
        recordedAt: latestMetric.recordedAt.toISOString(),
      } : null,
      activeAlerts: activeAlerts.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })),
      persons: persons.map(p => ({ ...p, updatedAt: p.updatedAt.toISOString() })),
      summary: {
        totalPersons: persons.length,
        atRiskPersons: atRiskCount,
        activeAlertCount: activeAlerts.length,
        criticalAlertCount: criticalAlerts,
        riskScore,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/sites", requireRole("admin", "operator"), async (req: AuthRequest, res) => {
  try {
    const parsed = insertSiteSchema.parse(req.body);
    const [site] = await db.insert(sitesTable).values(parsed).returning();

    const operator = req.sessionUser!;
    await db.insert(auditLogTable).values({
      actor: operator.email,
      actorRole: operator.role,
      action: "site.create",
      target: `site:${site.id}`,
      details: JSON.stringify({ name: site.name, type: site.type, location: site.location }),
    }).catch(() => {});

    return res.status(201).json({ ...site, createdAt: site.createdAt.toISOString() });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: "Invalid input" });
  }
});

router.patch("/sites/:id", requireRole("admin", "operator"), async (req: AuthRequest, res) => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId ?? "", 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid site ID" });

    const allowed = ["status", "currentRiskLevel", "uptime", "powerAvailability"];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const [updated] = await db
      .update(sitesTable)
      .set(updates as any)
      .where(eq(sitesTable.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Site not found" });

    const operator = req.sessionUser!;
    await db.insert(auditLogTable).values({
      actor: operator.email,
      actorRole: operator.role,
      action: "site.update",
      target: `site:${id}`,
      details: JSON.stringify(updates),
    }).catch(() => {});

    return res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

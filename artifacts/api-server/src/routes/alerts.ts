import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { unifiedAlertsTable, auditLogTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import type { AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get("/alerts", async (req, res) => {
  try {
    const { module, severity, status } = req.query as {
      module?: string;
      severity?: string;
      status?: string;
    };

    const validModules = ["energy", "lifemesh", "earthshield"];
    const validSeverities = ["critical", "warning", "info"];
    const validStatuses = ["active", "acknowledged", "resolved"];

    const conditions = [];
    if (module && validModules.includes(module)) {
      conditions.push(eq(unifiedAlertsTable.module, module as "energy" | "lifemesh" | "earthshield"));
    }
    if (severity && validSeverities.includes(severity)) {
      conditions.push(eq(unifiedAlertsTable.severity, severity as "critical" | "warning" | "info"));
    }
    if (status && validStatuses.includes(status)) {
      conditions.push(eq(unifiedAlertsTable.status, status as "active" | "acknowledged" | "resolved"));
    }

    const alerts = conditions.length > 0
      ? await db.select().from(unifiedAlertsTable).where(and(...conditions)).orderBy(desc(unifiedAlertsTable.createdAt))
      : await db.select().from(unifiedAlertsTable).orderBy(desc(unifiedAlertsTable.createdAt));

    res.json(alerts.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/alerts/:id/status", async (req: AuthRequest, res) => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId ?? "", 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid alert ID" });

    const { status } = req.body as { status?: string };
    const validStatuses = ["active", "acknowledged", "resolved"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const [updated] = await db
      .update(unifiedAlertsTable)
      .set({ status: status as "active" | "acknowledged" | "resolved" })
      .where(eq(unifiedAlertsTable.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Alert not found" });

    const actor = req.sessionUser?.email ?? "anonymous";
    const actorRole = req.sessionUser?.role ?? null;
    await db.insert(auditLogTable).values({
      actor,
      actorRole,
      action: `alert.${status}`,
      target: `alert:${id}`,
      details: JSON.stringify({ title: updated.title, severity: updated.severity, module: updated.module }),
    }).catch(() => {});

    return res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/alerts/broadcast", async (req: AuthRequest, res) => {
  try {
    const { title, module: mod, severity, location, description } = req.body as {
      title?: string;
      module?: string;
      severity?: string;
      location?: string;
      description?: string;
    };

    if (!title || !mod || !severity || !location || !description) {
      return res.status(400).json({ error: "All fields are required: title, module, severity, location, description" });
    }

    const validModules = ["energy", "lifemesh", "earthshield"];
    const validSeverities = ["critical", "warning", "info"];
    if (!validModules.includes(mod) || !validSeverities.includes(severity)) {
      return res.status(400).json({ error: "Invalid module or severity" });
    }

    const [alert] = await db.insert(unifiedAlertsTable).values({
      title,
      module: mod as "energy" | "lifemesh" | "earthshield",
      severity: severity as "critical" | "warning" | "info",
      location,
      description,
      status: "active",
    }).returning();

    const actor = req.sessionUser?.email ?? "anonymous";
    const actorRole = req.sessionUser?.role ?? null;
    await db.insert(auditLogTable).values({
      actor,
      actorRole,
      action: "alert.broadcast",
      target: `alert:${alert.id}`,
      details: JSON.stringify({ title, module: mod, severity }),
    }).catch(() => {});

    return res.status(201).json({ ...alert, createdAt: alert.createdAt.toISOString() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

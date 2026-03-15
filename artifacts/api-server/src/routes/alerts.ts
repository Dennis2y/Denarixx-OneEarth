import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { unifiedAlertsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

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

router.patch("/alerts/:id/status", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid alert ID" });

    const { status } = req.body;
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

    res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { unifiedAlertsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/alerts", async (req, res) => {
  try {
    const { module, severity } = req.query as { module?: string; severity?: string };

    const conditions = [];
    if (module) conditions.push(eq(unifiedAlertsTable.module, module as "energy" | "lifemesh" | "earthshield"));
    if (severity) conditions.push(eq(unifiedAlertsTable.severity, severity as "critical" | "warning" | "info"));

    const alerts = conditions.length > 0
      ? await db.select().from(unifiedAlertsTable).where(and(...conditions)).orderBy(unifiedAlertsTable.createdAt)
      : await db.select().from(unifiedAlertsTable).orderBy(unifiedAlertsTable.createdAt);

    res.json(alerts.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

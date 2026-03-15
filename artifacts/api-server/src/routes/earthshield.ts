import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { disasterAlertsTable, riskZonesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/earthshield/alerts", async (_req, res) => {
  try {
    const alerts = await db.select().from(disasterAlertsTable).orderBy(disasterAlertsTable.issuedAt);
    res.json(alerts.map((a) => ({
      ...a,
      issuedAt: a.issuedAt.toISOString(),
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/earthshield/risks", async (_req, res) => {
  try {
    const zones = await db.select().from(riskZonesTable).orderBy(riskZonesTable.name);
    res.json(zones);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

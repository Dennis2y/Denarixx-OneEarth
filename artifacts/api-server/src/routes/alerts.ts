import { Router } from "express";
import { db } from "@workspace/db";
import { unifiedAlertsTable } from "@workspace/db";
import { broadcastLiveEvent, makeLivePayload, getLiveClientCount } from "../lib/live.js";

const router = Router();

router.get("/alerts", async (_req, res) => {
  try {
    const alerts = await db.select().from(unifiedAlertsTable);

    return res.json(alerts.map(a => ({
      id: a.id,
      title: a.title,
      severity: a.severity,
      module: a.module,
      location: a.location,
      status: a.status,
      createdAt: a.createdAt.toISOString()
    })));

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/alerts", async (req, res) => {
  try {
    const { title, severity, module, location, description } = req.body;

    const [alert] = await db.insert(unifiedAlertsTable).values({
      title,
      severity,
      module,
      location,
      description,
      status: "active"
    }).returning();

    broadcastLiveEvent(
      "map-update",
      makeLivePayload(
        "alert:new",
        `New alert: ${title}`,
        {
          alertId: alert.id,
          severity,
          module,
          location,
          connectedClients: getLiveClientCount()
        }
      )
    );

    return res.json(alert);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

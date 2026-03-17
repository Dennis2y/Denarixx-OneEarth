import { Router } from "express";
import { db } from "@workspace/db";
import { unifiedAlertsTable } from "@workspace/db";
import { broadcastLiveEvent, makeLivePayload, getLiveClientCount } from "../lib/live.js";
import { scoreAlert } from "../lib/threat-score.js";

const router = Router();

router.get("/alerts", async (_req, res) => {
  try {
    const alerts = await db.select().from(unifiedAlertsTable);

    return res.json(alerts.map((a) => {
      const threat = scoreAlert({
        title: a.title,
        severity: a.severity,
        module: a.module,
        location: a.location,
        description: a.description ?? "",
      });

      return {
        id: a.id,
        title: a.title,
        severity: a.severity,
        module: a.module,
        location: a.location,
        status: a.status,
        description: a.description,
        createdAt: a.createdAt.toISOString(),
        ...threat,
      };
    }));
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
      status: "active",
    }).returning();

    const threat = scoreAlert({
      title: alert.title,
      severity: alert.severity,
      module: alert.module,
      location: alert.location,
      description: alert.description ?? "",
    });

    broadcastLiveEvent(
      "map-update",
      makeLivePayload("alert:new", `New alert: ${title}`, {
        alertId: alert.id,
        severity: alert.severity,
        module: alert.module,
        location: alert.location,
        connectedClients: getLiveClientCount(),
        ...threat,
      }),
    );

    return res.json({
      ...alert,
      createdAt: alert.createdAt.toISOString(),
      ...threat,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

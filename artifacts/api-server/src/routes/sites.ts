import { Router } from "express";
import { db } from "@workspace/db";
import { sitesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { broadcastLiveEvent, makeLivePayload, getLiveClientCount } from "../lib/live.js";
import { scoreSite } from "../lib/threat-score.js";

const router = Router();

router.get("/sites", async (_req, res) => {
  try {
    const sites = await db.select().from(sitesTable);

    return res.json(
      sites.map((site) => ({
        ...site,
        createdAt: site.createdAt.toISOString(),
        ...scoreSite(site),
      })),
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/sites/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const rows = await db.select().from(sitesTable).where(eq(sitesTable.id, id)).limit(1);
    const site = rows[0];

    if (!site) {
      return res.status(404).json({ error: "Site not found" });
    }

    return res.json({
      ...site,
      createdAt: site.createdAt.toISOString(),
      ...scoreSite(site),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/sites/:id/status", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status, riskLevel } = req.body;

    const [site] = await db
      .update(sitesTable)
      .set({
        status,
        currentRiskLevel: riskLevel,
      })
      .where(eq(sitesTable.id, id))
      .returning();

    const threat = scoreSite(site);

    broadcastLiveEvent(
      "map-update",
      makeLivePayload("site:update", "Site status updated", {
        siteId: site.id,
        siteName: site.name,
        status: site.status,
        riskLevel: site.currentRiskLevel,
        connectedClients: getLiveClientCount(),
        ...threat,
      }),
    );

    return res.json({
      ...site,
      createdAt: site.createdAt.toISOString(),
      ...threat,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

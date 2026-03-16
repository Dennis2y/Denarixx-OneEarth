import { Router } from "express";
import { db } from "@workspace/db";
import { sitesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { broadcastLiveEvent, makeLivePayload, getLiveClientCount } from "../lib/live.js";

const router = Router();

router.get("/sites", async (_req, res) => {
  const sites = await db.select().from(sitesTable);
  return res.json(sites);
});

router.post("/sites/:id/status", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status, riskLevel } = req.body;

    const [site] = await db.update(sitesTable)
      .set({
        status,
        currentRiskLevel: riskLevel
      })
      .where(eq(sitesTable.id, id))
      .returning();

    broadcastLiveEvent(
      "map-update",
      makeLivePayload(
        "site:update",
        `Site status updated`,
        {
          siteId: site.id,
          siteName: site.name,
          status: site.status,
          riskLevel: site.currentRiskLevel,
          connectedClients: getLiveClientCount()
        }
      )
    );

    return res.json(site);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

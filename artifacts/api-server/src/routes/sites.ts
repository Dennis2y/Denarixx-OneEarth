import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sitesTable, insertSiteSchema } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/sites", async (_req, res) => {
  try {
    const sites = await db.select().from(sitesTable).orderBy(sitesTable.name);
    res.json(sites.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/sites/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [site] = await db.select().from(sitesTable).where(eq(sitesTable.id, id));
    if (!site) return res.status(404).json({ error: "Site not found" });
    res.json({ ...site, createdAt: site.createdAt.toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/sites", async (req, res) => {
  try {
    const parsed = insertSiteSchema.parse(req.body);
    const [site] = await db.insert(sitesTable).values(parsed).returning();
    res.status(201).json({ ...site, createdAt: site.createdAt.toISOString() });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Invalid input" });
  }
});

export default router;

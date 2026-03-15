import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { auditLogTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/audit/log", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const entries = await db.select().from(auditLogTable).orderBy(desc(auditLogTable.createdAt)).limit(limit);
    res.json(entries.map(e => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

import { Router } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/health", async (_req, res) => {
  let dbStatus = "unknown";

  try {
    await db.execute(sql`select 1`);
    dbStatus = "connected";
  } catch {
    dbStatus = "error";
  }

  res.json({
    status: "ok",
    db: dbStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export default router;

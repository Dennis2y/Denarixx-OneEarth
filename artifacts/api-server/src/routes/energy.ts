import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { energyMetricsTable, sitesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/energy/metrics", async (req, res) => {
  try {
    const siteId = req.query.siteId ? parseInt(req.query.siteId as string) : null;
    const metrics = await db.select({
      metric: energyMetricsTable,
      siteName: sitesTable.name,
    }).from(energyMetricsTable).leftJoin(sitesTable, eq(energyMetricsTable.siteId, sitesTable.id));

    const filtered = siteId ? metrics.filter((m) => m.metric.siteId === siteId) : metrics;

    res.json(filtered.map((m) => ({
      id: m.metric.id,
      siteId: m.metric.siteId,
      siteName: m.siteName ?? "Unknown",
      solarGeneration: m.metric.solarGeneration,
      batteryLevel: m.metric.batteryLevel,
      communityLoad: m.metric.communityLoad,
      gridStatus: m.metric.gridStatus,
      uptime: m.metric.uptime,
      alerts: getEnergyAlerts(m.metric.batteryLevel, m.metric.gridStatus),
      recordedAt: m.metric.recordedAt.toISOString(),
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/energy/chart", async (req, res) => {
  try {
    const hours = ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
    const solarCurve = [5, 15, 35, 55, 72, 85, 92, 90, 83, 70, 52, 28, 8];
    const batteryCurve = [78, 80, 84, 88, 91, 94, 97, 95, 92, 89, 84, 79, 74];
    const loadCurve = [42, 45, 50, 55, 58, 60, 65, 68, 70, 68, 62, 58, 55];

    const data = hours.map((time, i) => ({
      time,
      solar: solarCurve[i],
      battery: batteryCurve[i],
      load: loadCurve[i],
    }));
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

function getEnergyAlerts(batteryLevel: number, gridStatus: string): string[] {
  const alerts: string[] = [];
  if (batteryLevel < 20) alerts.push("Low Battery Warning");
  if (batteryLevel < 10) alerts.push("Critical Battery Level");
  if (gridStatus === "unstable") alerts.push("Grid Instability Detected");
  if (gridStatus === "offline") alerts.push("Grid Offline - Running on Battery");
  return alerts;
}

export default router;

import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { protectedPersonsTable, safetyIncidentsTable, sitesTable, unifiedAlertsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { broadcastLiveEvent, makeLivePayload, getLiveClientCount } from "../lib/live.js";

const router: IRouter = Router();

router.get("/lifemesh/persons", async (_req, res) => {
  try {
    const persons = await db.select({
      person: protectedPersonsTable,
      siteName: sitesTable.name,
    }).from(protectedPersonsTable).leftJoin(sitesTable, eq(protectedPersonsTable.siteId, sitesTable.id));

    res.json(persons.map((p) => ({
      id: p.person.id,
      name: p.person.name,
      age: p.person.age,
      category: p.person.category,
      status: p.person.status,
      lastKnownLocation: p.person.lastKnownLocation,
      contactName: p.person.contactName,
      contactPhone: p.person.contactPhone,
      siteId: p.person.siteId,
      siteName: p.siteName ?? "Unknown",
      notes: p.person.notes ?? undefined,
      updatedAt: p.person.updatedAt.toISOString(),
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/lifemesh/incidents", async (_req, res) => {
  try {
    const incidents = await db.select().from(safetyIncidentsTable).orderBy(safetyIncidentsTable.occurredAt);
    res.json(incidents.map((i) => ({
      id: i.id,
      title: i.title,
      description: i.description,
      severity: i.severity,
      location: i.location,
      status: i.status,
      involvedPersons: [],
      responseChain: ["Regional Emergency Coordinator", "Local Response Team", "Family Liaison Officer"],
      occurredAt: i.occurredAt.toISOString(),
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/lifemesh/sos", async (req, res) => {
  try {
    const { personId, location, message } = req.body;

    const [incident] = await db.insert(safetyIncidentsTable).values({
      title: `SOS Alert - Person #${personId}`,
      description: message ?? `Emergency SOS triggered at ${location}`,
      severity: "critical",
      location: location ?? "Unknown",
      status: "open",
    }).returning();

    await db.insert(unifiedAlertsTable).values({
      title: `SOS Alert Triggered`,
      module: "lifemesh",
      severity: "critical",
      location: location ?? "Unknown",
      status: "active",
      description: `Emergency SOS has been triggered for person #${personId} at ${location}`,
    });

    broadcastLiveEvent(
      "map-update",
      makeLivePayload("lifemesh:sos", `SOS triggered for person #${personId}`, {
        personId,
        incidentId: incident.id,
        location: location ?? "Unknown",
        connectedClients: getLiveClientCount(),
      }),
    );

    res.json({
      success: true,
      incidentId: incident.id,
      message: "SOS alert dispatched. Emergency response teams have been notified.",
      responseTeam: [
        "Emergency Response Coordinator",
        "Local Police Unit",
        "Medical Emergency Team",
        "Family Liaison Officer",
      ],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

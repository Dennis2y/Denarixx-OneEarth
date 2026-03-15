import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, auditLogTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { AuthRequest } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get("/users", requireRole("admin", "operator", "government"), async (_req, res) => {
  try {
    const users = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      organization: usersTable.organization,
      status: usersTable.status,
      lastLogin: usersTable.lastLogin,
      createdAt: usersTable.createdAt,
    }).from(usersTable).orderBy(usersTable.name);

    res.json(users.map((u) => ({
      ...u,
      lastLogin: u.lastLogin?.toISOString() ?? null,
      createdAt: u.createdAt.toISOString(),
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/users/:id/status", requireRole("admin"), async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid user ID" });

    const { status } = req.body as { status?: string };
    const validStatuses = ["active", "inactive", "suspended"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const [updated] = await db
      .update(usersTable)
      .set({ status: status as "active" | "inactive" | "suspended" })
      .where(eq(usersTable.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "User not found" });

    const operator = req.sessionUser!;
    await db.insert(auditLogTable).values({
      actor: operator.email,
      actorRole: operator.role,
      action: `user.status_${status}`,
      target: `user:${id}`,
      details: JSON.stringify({ name: updated.name, email: updated.email, newStatus: status }),
    }).catch(() => {});

    return res.json({ ...updated, lastLogin: updated.lastLogin?.toISOString() ?? null, createdAt: updated.createdAt.toISOString() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/users", requireRole("admin"), async (req: AuthRequest, res) => {
  try {
    const { name, email, role, organization } = req.body as {
      name?: string; email?: string; role?: string; organization?: string;
    };

    if (!name || !email || !role || !organization) {
      return res.status(400).json({ error: "name, email, role, and organization are required" });
    }

    const validRoles = ["admin", "operator", "family", "government"];
    if (!validRoles.includes(role)) return res.status(400).json({ error: "Invalid role" });

    const [user] = await db.insert(usersTable).values({
      name,
      email,
      role: role as "admin" | "operator" | "family" | "government",
      organization,
      status: "active",
    }).returning();

    const operator = req.sessionUser!;
    await db.insert(auditLogTable).values({
      actor: operator.email,
      actorRole: operator.role,
      action: "user.create",
      target: `user:${user.id}`,
      details: JSON.stringify({ name, email, role }),
    }).catch(() => {});

    return res.status(201).json({ ...user, lastLogin: null, createdAt: user.createdAt.toISOString() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

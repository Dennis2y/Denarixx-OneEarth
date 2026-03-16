import { Router, type IRouter } from "express";
import { randomBytes, createHash } from "crypto";
import { db } from "@workspace/db";
import { auditLogTable, sessionsTable } from "@workspace/db";
import { and, eq, gt } from "drizzle-orm";

const router: IRouter = Router();

type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  organization: string;
  clearanceLevel: number;
};

function hashPassword(pw: string): string {
  return createHash("sha256").update(pw + "denarixx_salt_2026").digest("hex");
}

const DEMO_USERS: Array<SessionUser & { passwordHash: string }> = [
  {
    id: 1, name: "Cmdr. Prime", email: "commander@denarixx.io",
    passwordHash: hashPassword("denarixx2026"),
    role: "admin", organization: "Denarixx HQ", clearanceLevel: 5,
  },
  {
    id: 2, name: "Adaeze Okonkwo", email: "adaeze@denarixx.io",
    passwordHash: hashPassword("operator123"),
    role: "operator", organization: "Lagos Grid Ops", clearanceLevel: 3,
  },
  {
    id: 3, name: "Dr. Kofi Mensah", email: "kofi@gov.gh",
    passwordHash: hashPassword("gov2026"),
    role: "government", organization: "Ghana Disaster Authority", clearanceLevel: 4,
  },
  {
    id: 4, name: "Fatuma Wanjiru", email: "fatuma@community.ke",
    passwordHash: hashPassword("community1"),
    role: "community", organization: "Kibera Community Watch", clearanceLevel: 1,
  },
];

async function writeAudit(actor: string, actorRole: string | null, action: string, target?: string, details?: string) {
  try {
    await db.insert(auditLogTable).values({ actor, actorRole, action, target, details });
  } catch {
    // non-blocking
  }
}

async function getSessionUserByToken(token: string): Promise<SessionUser | null> {
  const now = new Date();

  const rows = await db
    .select()
    .from(sessionsTable)
    .where(and(eq(sessionsTable.token, token), gt(sessionsTable.expiresAt, now)))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.userId,
    name: row.name,
    email: row.email,
    role: row.role,
    organization: row.organization,
    clearanceLevel: row.clearanceLevel,
  };
}

export async function resolveSessionUserFromCookie(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  return getSessionUserByToken(token);
}

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = DEMO_USERS.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === hashPassword(password)
  );

  if (!user) {
    await writeAudit(email, null, "auth.login_failed", undefined, JSON.stringify({ ip: req.ip }));
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);

  await db.insert(sessionsTable).values({
    token,
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organization: user.organization,
    clearanceLevel: user.clearanceLevel,
    expiresAt,
  });

  await db.delete(sessionsTable).where(eq(sessionsTable.email, user.email));

  await db.insert(sessionsTable).values({
    token,
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organization: user.organization,
    clearanceLevel: user.clearanceLevel,
    expiresAt,
  });

  await writeAudit(user.email, user.role, "auth.login", `user:${user.id}`, JSON.stringify({ name: user.name }));

  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("den_session", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  });

  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organization: user.organization,
    clearanceLevel: user.clearanceLevel,
  });
});

router.get("/auth/me", async (req, res) => {
  const token = (req.cookies as Record<string, string>)?.den_session;
  if (!token) return res.status(401).json({ error: "No session" });

  const user = await getSessionUserByToken(token);
  if (!user) return res.status(401).json({ error: "Session expired" });

  return res.json(user);
});

router.post("/auth/logout", async (req, res) => {
  const token = (req.cookies as Record<string, string>)?.den_session;

  if (token) {
    const user = await getSessionUserByToken(token);
    if (user) {
      await writeAudit(user.email, user.role, "auth.logout", `user:${user.id}`);
    }
    await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
  }

  const isProduction = process.env.NODE_ENV === "production";

  res.clearCookie("den_session", {
    path: "/",
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });

  return res.json({ success: true });
});

export default router;

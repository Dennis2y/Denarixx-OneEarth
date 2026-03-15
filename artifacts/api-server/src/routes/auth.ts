import { Router, type IRouter } from "express";
import { randomBytes, createHash } from "crypto";
import { db } from "@workspace/db";
import { auditLogTable } from "@workspace/db";

const router: IRouter = Router();

type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  organization: string;
  clearanceLevel: number;
};

export const sessions = new Map<string, SessionUser>();

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
    // Non-blocking — audit failures should never break core flows
  }
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
  const { passwordHash: _, ...sessionUser } = user;
  sessions.set(token, sessionUser);

  await writeAudit(user.email, user.role, "auth.login", `user:${user.id}`, JSON.stringify({ name: user.name }));

  res.cookie("den_session", token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
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

router.get("/auth/me", (req, res) => {
  const token = (req.cookies as Record<string, string>)?.den_session;
  if (!token) return res.status(401).json({ error: "No session" });

  const user = sessions.get(token);
  if (!user) return res.status(401).json({ error: "Session expired" });

  return res.json(user);
});

router.post("/auth/logout", async (req, res) => {
  const token = (req.cookies as Record<string, string>)?.den_session;
  if (token) {
    const user = sessions.get(token);
    if (user) {
      await writeAudit(user.email, user.role, "auth.logout", `user:${user.id}`);
    }
    sessions.delete(token);
  }
  res.clearCookie("den_session", { path: "/" });
  return res.json({ success: true });
});

export default router;

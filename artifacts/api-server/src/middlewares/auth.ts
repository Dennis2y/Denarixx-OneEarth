import type { Request, Response, NextFunction } from "express";
import { sessions } from "../routes/auth.js";

export interface AuthRequest extends Request {
  sessionUser?: {
    id: number;
    name: string;
    email: string;
    role: string;
    organization: string;
    clearanceLevel: number;
  };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = (req.cookies as Record<string, string>)?.den_session;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized — no session" });
  }
  const user = sessions.get(token);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized — session expired" });
  }
  req.sessionUser = user;
  return next();
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.sessionUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!roles.includes(req.sessionUser.role)) {
      return res.status(403).json({ error: `Forbidden — requires role: ${roles.join(", ")}` });
    }
    return next();
  };
}

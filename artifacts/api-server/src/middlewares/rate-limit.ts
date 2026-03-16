import type { Request, Response, NextFunction } from "express";

type RateLimitOptions = {
  windowMs: number;
  max: number;
  message?: string;
};

type Entry = {
  count: number;
  resetAt: number;
};

export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = "Too many requests. Please try again later.",
  } = options;

  const store = new Map<string, Entry>();

  return function rateLimiter(req: Request, res: Response, next: NextFunction) {
    const now = Date.now();
    const key =
      req.ip ||
      req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ||
      "unknown";

    const existing = store.get(key);

    if (!existing || now > existing.resetAt) {
      store.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });

      res.setHeader("X-RateLimit-Limit", String(max));
      res.setHeader("X-RateLimit-Remaining", String(max - 1));
      res.setHeader("X-RateLimit-Reset", String(Math.ceil((now + windowMs) / 1000)));
      return next();
    }

    existing.count += 1;

    const remaining = Math.max(0, max - existing.count);
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(existing.resetAt / 1000)));

    if (existing.count > max) {
      return res.status(429).json({ error: message });
    }

    return next();
  };
}

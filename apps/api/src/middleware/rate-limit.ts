import type { RequestHandler } from "express";
import { AppError } from "@repo/contracts";

type Bucket = { count: number; resetAt: number };

const SWEEP_EVERY = 1_000;

export function rateLimit(options: {
  windowMs: number;
  max: number;
  message: string;
}): RequestHandler {
  const buckets = new Map<string, Bucket>();
  let requestsSinceSweep = 0;

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip ?? "unknown";

    if (++requestsSinceSweep >= SWEEP_EVERY) {
      requestsSinceSweep = 0;
      for (const [id, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(id);
      }
    }

    const existing = buckets.get(key);
    const bucket =
      existing && existing.resetAt > now
        ? existing
        : { count: 0, resetAt: now + options.windowMs };

    bucket.count += 1;
    buckets.set(key, bucket);

    const remaining = Math.max(0, options.max - bucket.count);
    const resetSeconds = Math.ceil((bucket.resetAt - now) / 1000);

    res.setHeader("RateLimit-Limit", options.max);
    res.setHeader("RateLimit-Remaining", remaining);
    res.setHeader("RateLimit-Reset", resetSeconds);

    if (bucket.count > options.max) {
      res.setHeader("Retry-After", resetSeconds);
      next(
        new AppError("RATE_LIMITED", options.message, {
          retryAfterSeconds: resetSeconds,
        }),
      );
      return;
    }

    next();
  };
}

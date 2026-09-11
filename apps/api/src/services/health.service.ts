import { env } from "@repo/config";
import type { ReadyResponse } from "@repo/contracts";
import { db } from "@repo/db";
import type { Logger } from "@repo/logger";
import { collectionSize, keyRingStatus, withTimeout } from "@repo/search";

const PROBE_TIMEOUT_MS = 2_000;
const CACHE_MS = 5_000;

class HealthService {
  private cached: { value: ReadyResponse; expiresAt: number } | null = null;

  liveness = (): { status: "ok"; uptime: number } => ({
    status: "ok",
    uptime: process.uptime(),
  });

  readiness = async (log: Logger): Promise<ReadyResponse> => {
    if (this.cached && this.cached.expiresAt > Date.now()) return this.cached.value;

    const [postgres, pending, qdrant] = await Promise.all([
      this.probe("postgres", log, () => db.vehicle.count()),
      this.probe("postgres", log, () =>
        db.vehicle.count({ where: { indexedAt: null } }),
      ),
      this.probe("qdrant", log, () => collectionSize()),
    ]);

    const keys = keyRingStatus();

    const value: ReadyResponse = {
      status: postgres !== null ? "ok" : "degraded",
      checks: { postgres: postgres !== null, qdrant: qdrant !== null },
      gemini: {
        total: keys.length,
        usable: keys.filter((key) => !key.disabled).length,
        available: keys.filter((key) => key.available).length,
      },
      index: {
        postgres: postgres ?? 0,
        qdrant: qdrant ?? 0,
        pending: pending ?? 0,
        model: env.EMBEDDING_MODEL,
        dimensions: env.EMBEDDING_DIMENSIONS,
      },
    };

    this.cached = { value, expiresAt: Date.now() + CACHE_MS };
    return value;
  };

  private probe = async <T>(
    name: string,
    log: Logger,
    fn: () => Promise<T>,
  ): Promise<T | null> => {
    try {
      return await withTimeout(name, PROBE_TIMEOUT_MS, fn());
    } catch (error) {
      log.warn({ err: error, dependency: name }, "health.dependency_down");
      return null;
    }
  };
}

export default new HealthService();

import { env } from "@repo/config";
import { db } from "@repo/db";
import { createLogger } from "@repo/logger";
import { getVocabulary } from "@repo/search";
import { createServer } from "./server.ts";

const log = createLogger("api");

const server = createServer().listen(env.PORT, () => {
  log.info({ port: env.PORT, env: env.NODE_ENV }, "api.started");
});

getVocabulary().catch((error: unknown) => {
  log.warn({ err: error }, "api.vocabulary_warmup_failed");
});

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  log.info({ signal }, "api.shutdown");

  const hardStop = setTimeout(() => process.exit(1), 8_000);
  hardStop.unref();

  await new Promise<void>((resolve) => server.close(() => resolve()));
  server.closeIdleConnections();
  await db.$disconnect();

  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

import { db } from "@repo/db";
import { createLogger } from "@repo/logger";
import type { Vocabulary } from "./canonical.ts";

const log = createLogger("vocabulary");

const REFRESH_MS = 10 * 60 * 1000;

export type { Vocabulary } from "./canonical.ts";

const EMPTY: Vocabulary = {
  makes: [],
  models: [],
  cities: [],
  colors: [],
  size: 0,
  loadedAt: 0,
};

let current: Vocabulary = EMPTY;
let inflight: Promise<Vocabulary> | null = null;

export async function getVocabulary(): Promise<Vocabulary> {
  if (Date.now() - current.loadedAt < REFRESH_MS) return current;
  if (inflight) return current.loadedAt > 0 ? current : inflight;

  inflight = load()
    .then((next) => {
      current = next;
      return next;
    })
    .catch((error: unknown) => {
      log.warn({ err: error }, "vocabulary.refresh_failed");
      return current;
    })
    .finally(() => {
      inflight = null;
    });

  return current.loadedAt > 0 ? current : inflight;
}

export function vocabularySnapshot(): Vocabulary {
  return current;
}

async function load(): Promise<Vocabulary> {
  const [makes, models, cities, colors, size] = await Promise.all([
    db.vehicle.findMany({
      distinct: ["make"],
      select: { make: true },
      orderBy: { make: "asc" },
    }),
    db.vehicle.findMany({
      distinct: ["make", "model"],
      select: { make: true, model: true },
      orderBy: [{ make: "asc" }, { model: "asc" }],
    }),
    db.vehicle.findMany({
      distinct: ["city"],
      select: { city: true },
      orderBy: { city: "asc" },
    }),
    db.vehicle.findMany({
      distinct: ["color"],
      select: { color: true },
      orderBy: { color: "asc" },
    }),
    db.vehicle.count(),
  ]);

  const vocabulary: Vocabulary = {
    makes: makes.map((row) => row.make),
    models: models.map((row) => ({ make: row.make, model: row.model })),
    cities: cities.map((row) => row.city),
    colors: colors.map((row) => row.color),
    size,
    loadedAt: Date.now(),
  };

  log.info(
    { makes: vocabulary.makes.length, models: vocabulary.models.length, size },
    "vocabulary.loaded",
  );

  return vocabulary;
}

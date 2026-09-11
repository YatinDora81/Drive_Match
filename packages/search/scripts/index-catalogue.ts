import { createHash } from "node:crypto";
import pLimit from "p-limit";
import { describeVehicle, titleOf } from "@repo/catalogue";
import { env } from "@repo/config";
import { db } from "@repo/db";
import { embedDocuments } from "../src/embedding/embedder.ts";
import { batched } from "../src/lib/batched.ts";
import {
  collectionSize,
  deleteVehicles,
  ensureCollection,
  listVehicleIds,
  upsertVehicles,
  type PointInput,
} from "../src/vector/repository.ts";

const all = process.argv.includes("--all");
const reset = process.argv.includes("--reset");
const BATCH = 32;

const sha256 = (text: string): string =>
  createHash("sha256").update(text).digest("hex");

await ensureCollection({ recreate: reset });

const vehicles = await db.vehicle.findMany({ orderBy: { id: "asc" } });

const pending = vehicles.filter((vehicle) => {
  if (all || reset) return true;
  if (!vehicle.indexedAt || vehicle.embeddingModel !== env.EMBEDDING_MODEL)
    return true;
  return vehicle.contentHash !== sha256(describeVehicle(vehicle));
});

console.log(`${vehicles.length} vehicles in postgres, ${pending.length} to embed`);

let done = 0;
let failed = 0;
const limit = pLimit(env.INDEX_CONCURRENCY);

await Promise.all(
  batched(pending, BATCH).map((batch) =>
    limit(async () => {
      const texts = batch.map((vehicle) => describeVehicle(vehicle));

      try {
        const vectors = await embedDocuments(texts);

        const points: PointInput[] = batch.map((vehicle, index) => ({
          id: vehicle.id,
          vector: vectors[index] as number[],
          payload: {
            title: titleOf(vehicle),
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            bodyType: vehicle.bodyType,
            fuelType: vehicle.fuelType,
            transmission: vehicle.transmission,
            price: vehicle.price,
            kmDriven: vehicle.kmDriven,
            ownerCount: vehicle.ownerCount,
            seats: vehicle.seats,
            safetyRating: vehicle.safetyRating,
            mileageKmpl: vehicle.mileageKmpl,
            rangeKm: vehicle.rangeKm,
            color: vehicle.color,
            city: vehicle.city,
            features: vehicle.features,
          },
        }));

        await upsertVehicles(points);

        const now = new Date();
        await db.$transaction(
          batch.map((vehicle, index) =>
            db.vehicle.update({
              where: { id: vehicle.id },
              data: {
                indexedAt: now,
                embeddingModel: env.EMBEDDING_MODEL,
                contentHash: sha256(texts[index] as string),
              },
            }),
          ),
        );

        done += batch.length;
        console.log(`indexed ${done}/${pending.length}`);
      } catch (error) {
        failed += batch.length;
        console.error(
          "batch failed, will retry on the next run:",
          error instanceof Error ? error.message : error,
        );
      }
    }),
  ),
);

const known = new Set(vehicles.map((vehicle) => vehicle.id));
const orphans = (await listVehicleIds()).filter((id) => !known.has(id));
await deleteVehicles(orphans);
if (orphans.length > 0)
  console.log(`removed ${orphans.length} vectors with no catalogue row`);

const points = await collectionSize();
const indexed = await db.vehicle.count({ where: { indexedAt: { not: null } } });

console.log(
  JSON.stringify({
    postgres: vehicles.length,
    indexed,
    qdrant: points,
    embedded: done,
    failed,
  }),
);

await db.$disconnect();
process.exit(failed > 0 ? 1 : 0);

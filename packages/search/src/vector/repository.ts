import { env } from "@repo/config";
import type { BodyType, FuelType, Transmission } from "@repo/contracts";
import { batched } from "../lib/batched.ts";
import { COLLECTION, qdrant } from "./client.ts";
import type { QdrantFilter } from "./filter.ts";

const UPSERT_BATCH = 64;

export type VehiclePayload = {
  title: string;
  make: string;
  model: string;
  year: number;
  bodyType: BodyType;
  fuelType: FuelType;
  transmission: Transmission;
  price: number;
  kmDriven: number;
  ownerCount: number;
  seats: number;
  safetyRating: number | null;
  mileageKmpl: number | null;
  rangeKm: number | null;
  color: string;
  city: string;
  features: string[];
};

export type PointInput = {
  id: string;
  vector: number[];
  payload: VehiclePayload;
};

export type VectorHit = {
  id: string;
  score: number;
  payload: VehiclePayload;
};

const PAYLOAD_INDEXES: Array<{
  field: string;
  schema: "keyword" | "integer" | "float";
}> = [
  { field: "bodyType", schema: "keyword" },
  { field: "fuelType", schema: "keyword" },
  { field: "transmission", schema: "keyword" },
  { field: "make", schema: "keyword" },
  { field: "model", schema: "keyword" },
  { field: "city", schema: "keyword" },
  { field: "color", schema: "keyword" },
  { field: "features", schema: "keyword" },
  { field: "price", schema: "integer" },
  { field: "kmDriven", schema: "integer" },
  { field: "year", schema: "integer" },
  { field: "seats", schema: "integer" },
  { field: "ownerCount", schema: "integer" },
  { field: "safetyRating", schema: "integer" },
  { field: "rangeKm", schema: "integer" },
  { field: "mileageKmpl", schema: "float" },
];

export async function ensureCollection(opts: { recreate?: boolean } = {}): Promise<{
  created: boolean;
  points: number;
}> {
  const existing = await qdrant.collectionExists(COLLECTION);

  if (existing.exists && opts.recreate) {
    await qdrant.deleteCollection(COLLECTION);
  } else if (existing.exists) {
    const info = await qdrant.getCollection(COLLECTION);
    return { created: false, points: info.points_count ?? 0 };
  }

  await qdrant.createCollection(COLLECTION, {
    vectors: { size: env.EMBEDDING_DIMENSIONS, distance: "Cosine" },
    on_disk_payload: false,
  });

  for (const index of PAYLOAD_INDEXES) {
    await qdrant.createPayloadIndex(COLLECTION, {
      wait: true,
      field_name: index.field,
      field_schema: index.schema,
    });
  }

  return { created: true, points: 0 };
}

export async function upsertVehicles(points: PointInput[]): Promise<void> {
  for (const batch of batched(points, UPSERT_BATCH)) {
    await qdrant.upsert(COLLECTION, {
      wait: true,
      points: batch.map((point) => ({
        id: point.id,
        vector: point.vector,
        payload: stripNulls(point.payload),
      })),
    });
  }
}

export async function listVehicleIds(): Promise<string[]> {
  const ids: string[] = [];
  let offset: string | number | Record<string, unknown> | null | undefined =
    undefined;

  do {
    const page = await qdrant.scroll(COLLECTION, {
      limit: 1_000,
      with_payload: false,
      with_vector: false,
      ...(offset !== undefined && offset !== null ? { offset } : {}),
    });
    for (const point of page.points) ids.push(String(point.id));
    offset = page.next_page_offset;
  } while (offset !== null && offset !== undefined);

  return ids;
}

export async function deleteVehicles(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await qdrant.delete(COLLECTION, { wait: true, points: ids });
}

export async function countVehicles(filter: QdrantFilter | null): Promise<number> {
  const result = await qdrant.count(COLLECTION, {
    exact: true,
    ...(filter ? { filter } : {}),
  });

  return result.count;
}

export async function searchVehicles(opts: {
  vector: number[];
  filter: QdrantFilter | null;
  limit: number;
  offset: number;
  scoreThreshold?: number;
}): Promise<VectorHit[]> {
  const response = await qdrant.query(COLLECTION, {
    query: opts.vector,
    limit: opts.limit,
    offset: opts.offset,
    ...(opts.filter ? { filter: opts.filter } : {}),
    ...(opts.scoreThreshold !== undefined
      ? { score_threshold: opts.scoreThreshold }
      : {}),
    with_payload: true,
    params: { hnsw_ef: 128, exact: false },
  });

  return response.points.map((point) => ({
    id: String(point.id),
    score: point.score,
    payload: readPayload(point.payload ?? {}),
  }));
}

export async function collectionReady(): Promise<boolean> {
  const result = await qdrant.collectionExists(COLLECTION);
  return result.exists;
}

export async function collectionSize(): Promise<number> {
  const info = await qdrant.getCollection(COLLECTION);
  return info.points_count ?? 0;
}

export const collectionName = COLLECTION;
export const vectorSize = env.EMBEDDING_DIMENSIONS;

function readPayload(raw: Record<string, unknown>): VehiclePayload {
  const str = (key: string) =>
    typeof raw[key] === "string" ? (raw[key] as string) : "";
  const num = (key: string) =>
    typeof raw[key] === "number" ? (raw[key] as number) : 0;
  const opt = (key: string) =>
    typeof raw[key] === "number" ? (raw[key] as number) : null;

  return {
    title: str("title"),
    make: str("make"),
    model: str("model"),
    year: num("year"),
    bodyType: str("bodyType") as BodyType,
    fuelType: str("fuelType") as FuelType,
    transmission: str("transmission") as Transmission,
    price: num("price"),
    kmDriven: num("kmDriven"),
    ownerCount: num("ownerCount"),
    seats: num("seats"),
    safetyRating: opt("safetyRating"),
    mileageKmpl: opt("mileageKmpl"),
    rangeKm: opt("rangeKm"),
    color: str("color"),
    city: str("city"),
    features: Array.isArray(raw.features)
      ? raw.features.filter((f): f is string => typeof f === "string")
      : [],
  };
}

function stripNulls(payload: VehiclePayload): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(payload).filter(
      ([, value]) => value !== null && value !== undefined,
    ),
  );
}

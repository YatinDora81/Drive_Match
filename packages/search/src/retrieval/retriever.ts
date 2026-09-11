import { env } from "@repo/config";
import type {
  RankedBy,
  SearchFilters,
  SearchMode,
  SearchSort,
} from "@repo/contracts";
import { db } from "@repo/db";
import { createLogger } from "@repo/logger";
import { buildQdrantFilter, hasHardConstraints } from "../vector/filter.ts";
import { searchVehicles, type VehiclePayload } from "../vector/repository.ts";
import { buildOrderBy, buildPrismaWhere } from "./prisma-where.ts";
import { matchedFeatures, rerank } from "./rerank.ts";

const log = createLogger("retrieval");

export const VECTOR_WINDOW = 100;
export const STRUCTURED_WINDOW = 500;

export type RankedId = {
  id: string;
  score: number | null;
  matchedFeatures: string[];
};

export type Page = {
  ids: RankedId[];
  total: number | null;
  hasMore: boolean;
  capped: boolean;
  mode: SearchMode;
  rankedBy: RankedBy;
};

export async function countMatches(filters: SearchFilters): Promise<number> {
  return db.vehicle.count({ where: buildPrismaWhere(filters) });
}

export async function vectorPage(opts: {
  vector: number[];
  filters: SearchFilters;
  total: number | null;
  limit: number;
  offset: number;
}): Promise<Page> {
  const filter = buildQdrantFilter(opts.filters);
  const window = Math.min(VECTOR_WINDOW, opts.total ?? VECTOR_WINDOW);

  const hits = await searchVehicles({
    vector: opts.vector,
    filter,
    limit: Math.max(window, 1),
    offset: 0,
    scoreThreshold: filter ? undefined : env.SEMANTIC_SCORE_THRESHOLD,
  });

  const ranked = rerank(
    hits.map((hit) => ({
      id: hit.id,
      score: hit.score,
      features: hit.payload.features ?? [],
      color: hit.payload.color ?? "",
      payload: hit.payload as VehiclePayload,
    })),
    opts.filters,
  );

  const page = ranked.slice(opts.offset, opts.offset + opts.limit);
  const reachable = Math.min(ranked.length, window);

  return {
    ids: page.map((entry) => ({
      id: entry.id,
      score: round(entry.score),
      matchedFeatures: entry.matchedFeatures,
    })),
    total: opts.total,
    hasMore: opts.offset + page.length < reachable,
    capped: opts.total !== null && opts.total > window,
    mode: "vector",
    rankedBy: "similarity",
  };
}

export async function structuredPage(opts: {
  filters: SearchFilters;
  sort: SearchSort | null;
  total: number;
  limit: number;
  offset: number;
}): Promise<Page> {
  const rows = await db.vehicle.findMany({
    where: buildPrismaWhere(opts.filters),
    orderBy: buildOrderBy(opts.sort),
    skip: opts.offset,
    take: opts.limit,
    select: { id: true, features: true },
  });

  return {
    ids: rows.map((row) => ({
      id: row.id,
      score: null,
      matchedFeatures: matchedFeatures(row.features, opts.filters),
    })),
    total: opts.total,
    hasMore: opts.offset + rows.length < opts.total,
    capped: false,
    mode: "structured",
    rankedBy: opts.sort ? "sort" : "default",
  };
}

export { hasHardConstraints };

const round = (value: number): number => Math.round(value * 10_000) / 10_000;

export function logFunnel(fields: Record<string, unknown>): void {
  log.info(fields, "retrieval.funnel");
}

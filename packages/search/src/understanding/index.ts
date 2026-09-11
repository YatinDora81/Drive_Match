import { createHash } from "node:crypto";
import { env } from "@repo/config";
import type { ParsedQuery, SearchFilters } from "@repo/contracts";
import { createLogger } from "@repo/logger";
import { hedge } from "../lib/hedge.ts";
import { LruCache } from "../lib/lru.ts";
import { withTimeout } from "../lib/timeout.ts";
import { parseHeuristic } from "./heuristic.ts";
import { PROMPT_VERSION, parseWithGemini } from "./llm.ts";
import { normalizeParse } from "./normalize.ts";
import { getVocabulary, type Vocabulary } from "./vocabulary.ts";

const log = createLogger("understanding");

export const PARSE_TIMEOUT_MS = 8_000;
export const HEDGE_AFTER_MS = 1_500;

const cache = new LruCache<ParsedQuery>(500, env.PARSE_CACHE_TTL_MS);
const inflight = new Map<string, Promise<ParsedQuery>>();

export type Understanding = {
  parsed: ParsedQuery;
  cached: boolean;
  ms: number;
  fallbackReason: string | null;
};

export function normalizeQuery(query: string): string {
  return query
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[₹]|rs\.?\s|inr\s/g, " ")
    .replace(/[^\p{L}\p{N}\s.+-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

const today = (): string => new Date().toISOString().slice(0, 10);

function cacheKey(query: string, vocabulary: Vocabulary): string {
  return createHash("sha256")
    .update(
      [
        env.GENERATION_MODEL,
        PROMPT_VERSION,
        vocabulary.loadedAt,
        today(),
        normalizeQuery(query),
      ].join("|"),
    )
    .digest("hex");
}

export async function understand(query: string): Promise<Understanding> {
  const startedAt = Date.now();
  const vocabulary = await getVocabulary();
  const key = cacheKey(query, vocabulary);

  const hit = cache.get(key);
  if (hit)
    return {
      parsed: hit,
      cached: true,
      ms: Date.now() - startedAt,
      fallbackReason: null,
    };

  const pending = inflight.get(key);
  if (pending) {
    const parsed = await pending;
    return {
      parsed,
      cached: true,
      ms: Date.now() - startedAt,
      fallbackReason: null,
    };
  }

  let fallbackReason: string | null = null;

  const run = (async (): Promise<ParsedQuery> => {
    try {
      const day = today();
      const { raw, usage, model } = await withTimeout(
        "parse",
        PARSE_TIMEOUT_MS,
        hedge(
          () =>
            parseWithGemini(query, vocabulary, {
              today: day,
              model: env.GENERATION_MODEL,
              deadlineMs: PARSE_TIMEOUT_MS,
            }),
          () =>
            parseWithGemini(query, vocabulary, {
              today: day,
              model: env.UTILITY_MODEL,
              deadlineMs: PARSE_TIMEOUT_MS - HEDGE_AFTER_MS,
            }),
          HEDGE_AFTER_MS,
        ),
      );
      const parsed = reconcile(
        normalizeParse(raw, query, vocabulary, "llm"),
        query,
        vocabulary,
      );
      log.info(
        {
          model,
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
        },
        "understanding.llm",
      );
      cache.set(key, parsed);
      return parsed;
    } catch (error) {
      fallbackReason = error instanceof Error ? error.message : String(error);
      log.warn({ err: error }, "understanding.fallback");
      return parseHeuristic(query, vocabulary);
    }
  })();

  inflight.set(key, run);

  try {
    const parsed = await run;
    return { parsed, cached: false, ms: Date.now() - startedAt, fallbackReason };
  } finally {
    inflight.delete(key);
  }
}

export async function understandHeuristically(query: string): Promise<ParsedQuery> {
  return parseHeuristic(query, await getVocabulary());
}

const PRICE_FIELDS = ["priceMin", "priceMax"] as const;

function reconcile(
  parsed: ParsedQuery,
  query: string,
  vocabulary: Vocabulary,
): ParsedQuery {
  const heuristic = parseHeuristic(query, vocabulary);
  const filters: SearchFilters = { ...parsed.filters };
  const warnings = [...parsed.warnings];

  for (const field of PRICE_FIELDS) {
    const llm = filters[field];
    const det = heuristic.filters[field];
    if (llm === undefined || det === undefined) continue;

    const droppedZeros = llm < 100_000 && det >= 100_000;
    const extraZeros = llm >= det * 100;
    if (droppedZeros || extraZeros) {
      filters[field] = det;
      warnings.push(
        `Read the ${field === "priceMax" ? "budget" : "price floor"} as ₹${det.toLocaleString("en-IN")}.`,
      );
    }
  }

  const strong = [
    "bodyTypes",
    "fuelTypes",
    "transmissions",
    "models",
    "makes",
    "priceMax",
    "priceMin",
    "kmMax",
    "seatsMin",
  ];
  const isVehicleQuery =
    parsed.isVehicleQuery || strong.some((key) => key in heuristic.filters);

  return { ...parsed, filters, warnings, isVehicleQuery };
}

export function understandingCacheSize(): number {
  return cache.size;
}

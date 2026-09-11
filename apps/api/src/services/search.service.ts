import { env } from "@repo/config";
import {
  AppError,
  isAppError,
  type ParsedQuery,
  type SearchFilters,
  type SearchRequest,
  type SearchResponse,
  type SearchResult,
  type SearchTimings,
} from "@repo/contracts";
import { db, type Parser, type Prisma, type SearchMode } from "@repo/db";
import type { Logger } from "@repo/logger";
import {
  countMatches,
  embedQuery,
  getVocabulary,
  hasHardConstraints,
  normalizeFilters,
  relax,
  structuredPage,
  summarize,
  understand,
  vectorPage,
  withTimeout,
  type Page,
} from "@repo/search";
import { toVehicleDto } from "../lib/dto.ts";

const EMBED_TIMEOUT_MS = 3_000;
const VECTOR_TIMEOUT_MS = 4_000;
const EXPLAIN_TIMEOUT_MS = 6_000;

const EXAMPLES = [
  "Show SUVs under ₹15L",
  "Diesel automatic cars below 80k km",
  "Family cars with high safety ratings",
];

type Context = { requestId: string; log: Logger };

type Outcome = {
  response: SearchResponse | null;
  error: unknown;
  understood: ParsedQuery | null;
  timings: SearchTimings;
  embeddingCached: boolean;
  understandingCached: boolean;
};

const now = () => Date.now();

const blankTimings = (): SearchTimings => ({
  parseMs: 0,
  embedMs: 0,
  searchMs: 0,
  hydrateMs: 0,
  explainMs: 0,
  totalMs: 0,
});

const PARSER_ENUM: Record<ParsedQuery["parser"], Parser> = {
  llm: "LLM",
  heuristic: "HEURISTIC",
  override: "OVERRIDE",
};

const MODE_ENUM: Record<SearchResponse["meta"]["mode"], SearchMode> = {
  vector: "VECTOR",
  structured: "STRUCTURED",
};

class SearchService {
  search = async (input: SearchRequest, ctx: Context): Promise<SearchResponse> => {
    const startedAt = now();
    const outcome = await this.run(input, ctx, startedAt);

    outcome.timings.totalMs = now() - startedAt;
    this.record(input, ctx, outcome);

    if (outcome.response) return outcome.response;
    throw outcome.error;
  };

  parse = async (query: string): Promise<ParsedQuery> => {
    const { parsed } = await understand(query);
    return parsed;
  };

  private run = async (
    input: SearchRequest,
    ctx: Context,
    startedAt: number,
  ): Promise<Outcome> => {
    const timings = blankTimings();
    const limit = input.limit ?? env.SEARCH_DEFAULT_LIMIT;
    const offset = input.offset;
    let understood: ParsedQuery | null = null;
    let understandingCached = false;
    let embeddingCached = false;

    try {
      const override = input.filters !== undefined;

      if (input.filters !== undefined) {
        understood = await this.fromOverride(input, input.filters);
      } else {
        const result = await understand(input.query);
        understood = result.parsed;
        understandingCached = result.cached;
        timings.parseMs = result.ms;

        if (!understood.isVehicleQuery) {
          throw new AppError(
            "UNSUPPORTED_QUERY",
            "That doesn't look like a vehicle search. Try describing the car you want.",
            { examples: EXAMPLES },
          );
        }
      }

      const requested = understood.filters;
      const hard = hasHardConstraints(requested);

      const searchStartedAt = now();
      let applied: SearchFilters = requested;
      let relaxed: SearchResponse["meta"]["relaxed"] = [];
      let total: number | null = hard ? await countMatches(requested) : null;

      if (hard && total === 0 && !override) {
        const outcome = await relax(requested, countMatches);
        applied = outcome.filters;
        relaxed = outcome.steps;
        total = outcome.total;
      }

      let page: Page | null = null;
      let degraded = false;

      if (total !== 0) {
        const wantsVector = understood.hasSemanticIntent && !understood.sort;

        if (wantsVector) {
          try {
            const embedStartedAt = now();
            const embedding = await withTimeout(
              "embed",
              EMBED_TIMEOUT_MS,
              embedQuery(understood.semanticQuery),
            );
            timings.embedMs = now() - embedStartedAt;
            embeddingCached = embedding.cached;

            page = await withTimeout(
              "vector search",
              VECTOR_TIMEOUT_MS,
              vectorPage({
                vector: embedding.vector,
                filters: applied,
                total,
                limit,
                offset,
              }),
            );

            if (page.ids.length === 0 && offset === 0 && (total ?? 0) > 0) {
              ctx.log.warn({ total }, "search.vector_empty_but_catalogue_matches");
              page = null;
              degraded = true;
            }
          } catch (error) {
            if (isAppError(error) && error.code === "RATE_LIMITED" && !hard)
              throw error;
            ctx.log.warn({ err: error }, "search.vector_path_failed");
            degraded = true;
          }
        }

        if (!page) {
          if (!hard && degraded) {
            throw new AppError(
              "SERVICE_UNAVAILABLE",
              "Semantic search is unavailable right now and the request has no filters to fall back on. Try again shortly or add a budget, body type or fuel.",
            );
          }

          const structuredTotal = total ?? (await db.vehicle.count());
          page = await structuredPage({
            filters: applied,
            sort: understood.sort,
            total: structuredTotal,
            limit,
            offset,
          });
          if (!hard) total = null;
        }
      }

      timings.searchMs = now() - searchStartedAt;

      const hydrateStartedAt = now();
      const results = page ? await this.hydrate(page, ctx) : [];
      timings.hydrateMs = now() - hydrateStartedAt;

      let summary: string | null = null;
      if (input.explain && results.length > 0) {
        const explainStartedAt = now();
        summary = await withTimeout(
          "explain",
          EXPLAIN_TIMEOUT_MS,
          summarize(
            input.query,
            understood,
            results,
            relaxed.map((step) => step.message),
          ),
        ).catch((error: unknown) => {
          ctx.log.warn({ err: error }, "search.explain_failed");
          return null;
        });
        timings.explainMs = now() - explainStartedAt;
      }

      const catalogueSize = (await getVocabulary()).size;

      const response: SearchResponse = {
        query: input.query,
        understood,
        requested,
        applied,
        results,
        summary,
        meta: {
          total,
          returned: results.length,
          limit,
          offset,
          hasMore: page?.hasMore ?? false,
          capped: page?.capped ?? false,
          exact: relaxed.length === 0,
          relaxed,
          mode: page?.mode ?? "structured",
          rankedBy: page?.rankedBy ?? "default",
          degraded,
          cache: { understanding: understandingCached, embedding: embeddingCached },
          catalogueSize,
          requestId: ctx.requestId,
          timings: { ...timings, totalMs: now() - startedAt },
          model: {
            generation: env.GENERATION_MODEL,
            embedding: env.EMBEDDING_MODEL,
          },
        },
      };

      ctx.log.info(
        {
          parser: understood.parser,
          mode: response.meta.mode,
          rankedBy: response.meta.rankedBy,
          degraded,
          filters: applied,
          total,
          returned: results.length,
          topScore: results[0]?.score ?? null,
          relaxed: relaxed.map((step) => step.code),
          cache: response.meta.cache,
          timings: response.meta.timings,
        },
        "search.complete",
      );

      return {
        response,
        error: null,
        understood,
        timings,
        embeddingCached,
        understandingCached,
      };
    } catch (error) {
      return {
        response: null,
        error,
        understood,
        timings,
        embeddingCached,
        understandingCached,
      };
    }
  };

  private fromOverride = async (
    input: SearchRequest,
    filters: SearchFilters,
  ): Promise<ParsedQuery> => {
    const vocabulary = await getVocabulary();
    const normalized = normalizeFilters(filters, vocabulary);

    return {
      isVehicleQuery: true,
      hasSemanticIntent: input.hasSemanticIntent ?? true,
      semanticQuery: input.semanticQuery ?? input.query,
      filters: normalized.filters,
      sort: input.sort && input.sort.field !== "relevance" ? input.sort : null,
      notes: "Using the filters as given.",
      warnings: normalized.warnings,
      parser: "override",
    };
  };

  private hydrate = async (page: Page, ctx: Context): Promise<SearchResult[]> => {
    if (page.ids.length === 0) return [];

    const rows = await db.vehicle.findMany({
      where: { id: { in: page.ids.map((entry) => entry.id) } },
    });
    const byId = new Map(rows.map((row) => [row.id, row]));

    const results: SearchResult[] = [];
    const missing: string[] = [];

    for (const [index, entry] of page.ids.entries()) {
      const row = byId.get(entry.id);
      if (!row) {
        missing.push(entry.id);
        continue;
      }
      results.push({
        vehicle: toVehicleDto(row),
        score: entry.score,
        rank: index + 1,
        matchedFeatures: entry.matchedFeatures,
      });
    }

    if (missing.length > 0) ctx.log.warn({ missing }, "search.hydrate_miss");

    return results;
  };

  private record = (input: SearchRequest, ctx: Context, outcome: Outcome): void => {
    const status = outcome.response
      ? 200
      : isAppError(outcome.error)
        ? outcome.error.status
        : 500;
    const meta = outcome.response?.meta;

    const data: Prisma.SearchLogCreateInput = {
      query: input.query.slice(0, 500),
      requestId: ctx.requestId,
      status,
      errorCode: outcome.response
        ? null
        : isAppError(outcome.error)
          ? outcome.error.code
          : "INTERNAL",
      parser: outcome.understood ? PARSER_ENUM[outcome.understood.parser] : null,
      parsed: outcome.understood
        ? ({
            filters: outcome.understood.filters,
            sort: outcome.understood.sort,
            semanticQuery: outcome.understood.semanticQuery,
            hasSemanticIntent: outcome.understood.hasSemanticIntent,
          } as Prisma.InputJsonValue)
        : undefined,
      mode: meta ? MODE_ENUM[meta.mode] : null,
      rankedBy: meta?.rankedBy ?? null,
      degraded: meta?.degraded ?? false,
      explain: input.explain,
      offset: input.offset,
      limit: input.limit ?? env.SEARCH_DEFAULT_LIMIT,
      resultCount: meta?.returned ?? 0,
      total: meta?.total ?? null,
      exact: meta?.exact ?? true,
      relaxed: meta
        ? (meta.relaxed as unknown as Prisma.InputJsonValue)
        : undefined,
      warnings: outcome.understood
        ? (outcome.understood.warnings as unknown as Prisma.InputJsonValue)
        : undefined,
      topScore: outcome.response?.results[0]?.score ?? null,
      understandingCached: outcome.understandingCached,
      embeddingCached: outcome.embeddingCached,
      understandingModel: env.GENERATION_MODEL,
      embeddingModel: env.EMBEDDING_MODEL,
      parseMs: outcome.timings.parseMs,
      embedMs: outcome.timings.embedMs,
      searchMs: outcome.timings.searchMs,
      totalMs: outcome.timings.totalMs,
    };

    db.searchLog.create({ data }).catch((error: unknown) => {
      ctx.log.warn({ err: error }, "search.log_failed");
    });
  };
}

export default new SearchService();

export { callGemini, keyRingStatus, type KeyStatus } from "./gemini/key-ring.ts";

export {
  embedDocuments,
  embedQuery,
  type QueryEmbedding,
} from "./embedding/embedder.ts";

export {
  collectionName,
  collectionReady,
  collectionSize,
  countVehicles,
  deleteVehicles,
  ensureCollection,
  listVehicleIds,
  searchVehicles,
  upsertVehicles,
  vectorSize,
  type PointInput,
  type VectorHit,
  type VehiclePayload,
} from "./vector/repository.ts";

export {
  buildQdrantFilter,
  hasHardConstraints,
  type QdrantFilter,
} from "./vector/filter.ts";

export {
  PARSE_TIMEOUT_MS,
  normalizeQuery,
  understand,
  understandHeuristically,
  understandingCacheSize,
  type Understanding,
} from "./understanding/index.ts";
export { parseHeuristic } from "./understanding/heuristic.ts";
export {
  normalizeFilters,
  normalizeParse,
  normalizeSort,
} from "./understanding/normalize.ts";
export { getVocabulary, vocabularySnapshot } from "./understanding/vocabulary.ts";
export {
  canonicalCity,
  canonicalColor,
  canonicalFeature,
  canonicalMake,
  canonicalModel,
  type Vocabulary,
} from "./understanding/canonical.ts";

export {
  DEFAULT_ORDER,
  buildOrderBy,
  buildPrismaWhere,
} from "./retrieval/prisma-where.ts";
export {
  MAX_RELAXATION_STEPS,
  RELAXATION_LADDER,
  relax,
} from "./retrieval/relaxation.ts";
export { rerank, matchedFeatures } from "./retrieval/rerank.ts";
export {
  STRUCTURED_WINDOW,
  VECTOR_WINDOW,
  countMatches,
  logFunnel,
  structuredPage,
  vectorPage,
  type Page,
  type RankedId,
} from "./retrieval/retriever.ts";

export { summarize } from "./explain/summarizer.ts";

export { StageTimeout, isStageTimeout, withTimeout } from "./lib/timeout.ts";
export { LruCache } from "./lib/lru.ts";

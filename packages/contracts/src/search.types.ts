import type { SearchFilters, SearchSort } from "./search.schema.ts";
import type { Vehicle } from "./vehicle.ts";

export const PARSERS = ["llm", "heuristic", "override"] as const;
export type Parser = (typeof PARSERS)[number];

export const SEARCH_MODES = ["vector", "structured"] as const;
export type SearchMode = (typeof SEARCH_MODES)[number];

export const RANKINGS = ["similarity", "sort", "default"] as const;
export type RankedBy = (typeof RANKINGS)[number];

export type ParsedQuery = {
  isVehicleQuery: boolean;
  hasSemanticIntent: boolean;
  semanticQuery: string;
  filters: SearchFilters;
  sort: SearchSort | null;
  notes: string;
  warnings: string[];
  parser: Parser;
};

export type SearchResult = {
  vehicle: Vehicle;
  score: number | null;
  rank: number;
  matchedFeatures: string[];
};

export type RelaxationStep = {
  code: string;
  field: keyof SearchFilters;
  from: unknown;
  to?: unknown;
  message: string;
};

export type SearchTimings = {
  parseMs: number;
  embedMs: number;
  searchMs: number;
  hydrateMs: number;
  explainMs: number;
  totalMs: number;
};

export type SearchMeta = {
  total: number | null;
  returned: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  capped: boolean;
  exact: boolean;
  relaxed: RelaxationStep[];
  mode: SearchMode;
  rankedBy: RankedBy;
  degraded: boolean;
  cache: { understanding: boolean; embedding: boolean };
  catalogueSize: number;
  requestId: string | null;
  timings: SearchTimings;
  model: { generation: string; embedding: string };
};

export type SearchResponse = {
  query: string;
  understood: ParsedQuery;
  requested: SearchFilters;
  applied: SearchFilters;
  results: SearchResult[];
  summary: string | null;
  meta: SearchMeta;
};

export type FacetBucket = { value: string; count: number };

export type Facets = {
  total: number;
  makes: FacetBucket[];
  models: FacetBucket[];
  bodyTypes: FacetBucket[];
  fuelTypes: FacetBucket[];
  transmissions: FacetBucket[];
  cities: FacetBucket[];
  colors: FacetBucket[];
  features: FacetBucket[];
  price: { min: number; max: number };
  kmDriven: { min: number; max: number };
  year: { min: number; max: number };
};

export type ReadyResponse = {
  status: "ok" | "degraded";
  checks: { postgres: boolean; qdrant: boolean };
  gemini: { total: number; usable: number; available: number };
  index: {
    postgres: number;
    qdrant: number;
    pending: number;
    model: string;
    dimensions: number;
  };
};

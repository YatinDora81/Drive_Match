export const BODY_TYPES = [
  "HATCHBACK",
  "SEDAN",
  "SUV",
  "MPV",
  "COUPE",
  "PICKUP",
] as const;
export const FUEL_TYPES = [
  "PETROL",
  "DIESEL",
  "CNG",
  "ELECTRIC",
  "HYBRID",
] as const;
export const TRANSMISSIONS = ["MANUAL", "AUTOMATIC"] as const;

export const FEATURES = [
  "sunroof",
  "panoramic sunroof",
  "6 airbags",
  "ADAS",
  "360 camera",
  "rear camera",
  "ventilated seats",
  "leather seats",
  "cruise control",
  "adaptive cruise control",
  "wireless charging",
  "Apple CarPlay",
  "Android Auto",
  "touchscreen",
  "ISOFIX",
  "rear AC vents",
  "automatic climate control",
  "keyless entry",
  "push button start",
  "LED headlamps",
  "alloy wheels",
  "hill hold assist",
  "ESC",
  "TPMS",
  "fast charging",
  "connected car tech",
  "heads-up display",
  "premium audio",
  "electric tailgate",
  "captain seats",
] as const;

export const SORT_FIELDS = [
  "price",
  "kmDriven",
  "year",
  "safetyRating",
  "mileageKmpl",
  "relevance",
] as const;

export type BodyType = (typeof BODY_TYPES)[number];
export type FuelType = (typeof FUEL_TYPES)[number];
export type Transmission = (typeof TRANSMISSIONS)[number];
export type Feature = (typeof FEATURES)[number];
export type SortField = (typeof SORT_FIELDS)[number];
export type SortDirection = "asc" | "desc";

export type Vehicle = {
  id: string;
  make: string;
  model: string;
  variant: string;
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
  engineCc: number | null;
  batteryKwh: number | null;
  powerBhp: number | null;
  color: string;
  city: string;
  registrationState: string;
  features: string[];
  description: string;
  indexedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SearchFilters = {
  bodyTypes?: BodyType[];
  fuelTypes?: FuelType[];
  transmissions?: Transmission[];
  makes?: string[];
  models?: string[];
  cities?: string[];
  colors?: string[];
  features?: Feature[];
  excludeBodyTypes?: BodyType[];
  excludeFuelTypes?: FuelType[];
  excludeMakes?: string[];
  priceMin?: number;
  priceMax?: number;
  kmMin?: number;
  kmMax?: number;
  yearMin?: number;
  yearMax?: number;
  seatsMin?: number;
  seatsMax?: number;
  safetyRatingMin?: number;
  ownerCountMax?: number;
  mileageMin?: number;
  rangeMin?: number;
};

export type SearchSort = { field: SortField; direction: SortDirection };

export type SearchRequest = {
  query: string;
  limit?: number;
  offset?: number;
  explain?: boolean;
  filters?: SearchFilters;
  semanticQuery?: string;
  hasSemanticIntent?: boolean;
  sort?: SearchSort | null;
};

export type Parser = "llm" | "heuristic" | "override";
export type SearchMode = "vector" | "structured";
export type RankedBy = "similarity" | "sort" | "default";

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

export type VehicleList = { data: Vehicle[]; nextCursor: string | null };

export type ListVehiclesParams = {
  bodyType?: BodyType[];
  fuelType?: FuelType[];
  transmission?: Transmission[];
  make?: string[];
  model?: string[];
  city?: string[];
  priceMin?: number;
  priceMax?: number;
  kmMax?: number;
  yearMin?: number;
  yearMax?: number;
  seatsMin?: number;
  safetyRatingMin?: number;
  sort?: Exclude<SortField, "relevance">;
  order?: SortDirection;
  cursor?: string;
  limit?: number;
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

export type ErrorCodeName =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONTENT_TOO_LARGE"
  | "UNSUPPORTED_TYPE"
  | "UNSUPPORTED_QUERY"
  | "RATE_LIMITED"
  | "UPSTREAM_ERROR"
  | "EMBEDDING_FAILED"
  | "SERVICE_UNAVAILABLE"
  | "CATALOGUE_UNAVAILABLE"
  | "UPSTREAM_TIMEOUT"
  | "INTERNAL";

export type ErrorEnvelope = {
  error: {
    code: ErrorCodeName | string;
    message: string;
    details: unknown;
    requestId: string;
  };
};

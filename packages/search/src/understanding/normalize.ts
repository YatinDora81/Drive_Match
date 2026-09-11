import {
  searchFiltersSchema,
  searchSortSchema,
  type ParsedQuery,
  type Parser,
  type SearchFilters,
  type SearchSort,
} from "@repo/contracts";
import {
  canonicalCity,
  canonicalColor,
  canonicalFeature,
  canonicalMake,
  canonicalModel,
  type Vocabulary,
} from "./canonical.ts";

export type RawParse = {
  isVehicleQuery?: unknown;
  hasSemanticIntent?: unknown;
  semanticQuery?: unknown;
  filters?: Record<string, unknown> | null;
  sort?: unknown;
  notes?: unknown;
};

const unique = <T>(values: T[]): T[] => [...new Set(values)];

const strings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter(
        (entry): entry is string =>
          typeof entry === "string" && entry.trim() !== "",
      )
    : [];

const number = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const swapIfInverted = (
  filters: SearchFilters,
  min: "priceMin" | "kmMin" | "yearMin" | "seatsMin",
  max: "priceMax" | "kmMax" | "yearMax" | "seatsMax",
): void => {
  const low = filters[min];
  const high = filters[max];
  if (low !== undefined && high !== undefined && low > high) {
    filters[min] = high;
    filters[max] = low;
  }
};

export type Normalized = {
  filters: SearchFilters;
  unmatched: string[];
  warnings: string[];
};

export function normalizeFilters(
  raw: Record<string, unknown> | null | undefined,
  vocabulary: Vocabulary,
): Normalized {
  const input = raw ?? {};
  const out: Record<string, unknown> = {};
  const unmatched: string[] = [];
  const warnings: string[] = [];

  const enums = [
    "bodyTypes",
    "fuelTypes",
    "transmissions",
    "excludeBodyTypes",
    "excludeFuelTypes",
  ];
  for (const key of enums) {
    const values = unique(strings(input[key]).map((value) => value.toUpperCase()));
    if (values.length > 0) out[key] = values;
  }

  const makes = new Set<string>();
  const models = new Set<string>();

  for (const value of strings(input.makes)) {
    const make = canonicalMake(value, vocabulary);
    if (make) {
      makes.add(make);
      continue;
    }
    const model = canonicalModel(value, vocabulary);
    if (model) models.add(model.model);
    else unmatched.push(value);
  }

  for (const value of strings(input.models)) {
    const model = canonicalModel(value, vocabulary);
    if (model) {
      models.add(model.model);
      continue;
    }
    const make = canonicalMake(value, vocabulary);
    if (make) makes.add(make);
    else unmatched.push(value);
  }

  for (const entry of vocabulary.models) {
    if (models.has(entry.model)) makes.delete(entry.make);
  }

  if (models.size > 0) out.models = [...models];
  if (makes.size > 0) out.makes = [...makes];

  const excludeMakes = unique(
    strings(input.excludeMakes)
      .map((value) => canonicalMake(value, vocabulary))
      .filter((value): value is string => value !== null),
  );
  if (excludeMakes.length > 0) out.excludeMakes = excludeMakes;

  const cities: string[] = [];
  for (const value of strings(input.cities)) {
    const city = canonicalCity(value, vocabulary);
    if (city) cities.push(city);
    else {
      unmatched.push(value);
      warnings.push(`We don't list cars in ${value}, so the city was ignored.`);
    }
  }
  if (cities.length > 0) out.cities = unique(cities);

  const colors: string[] = [];
  for (const value of strings(input.colors)) {
    const color = canonicalColor(value, vocabulary);
    if (color) colors.push(color);
    else unmatched.push(value);
  }
  if (colors.length > 0) out.colors = unique(colors);

  const features: string[] = [];
  for (const value of strings(input.features)) {
    const feature = canonicalFeature(value);
    if (feature) features.push(feature);
    else unmatched.push(value);
  }
  if (features.length > 0) out.features = unique(features);

  const numeric = [
    "priceMin",
    "priceMax",
    "kmMin",
    "kmMax",
    "yearMin",
    "yearMax",
    "seatsMin",
    "seatsMax",
    "safetyRatingMin",
    "ownerCountMax",
    "mileageMin",
    "rangeMin",
  ] as const;

  for (const key of numeric) {
    const value = number(input[key]);
    if (value === undefined) continue;
    out[key] = key === "mileageMin" ? value : Math.round(value);
  }

  if (typeof out.safetyRatingMin === "number") {
    out.safetyRatingMin = Math.max(0, Math.min(5, out.safetyRatingMin));
  }
  if (typeof out.ownerCountMax === "number" && out.ownerCountMax < 1)
    out.ownerCountMax = 1;

  const shape = searchFiltersSchema.shape;
  const filters: SearchFilters = {};

  for (const key of Object.keys(shape) as Array<keyof SearchFilters>) {
    if (out[key] === undefined) continue;
    const result = shape[key].safeParse(out[key]);
    if (result.success && result.data !== undefined) {
      (filters as Record<string, unknown>)[key] = result.data;
    } else {
      warnings.push(`Ignored an out-of-range value for ${key}.`);
    }
  }

  swapIfInverted(filters, "priceMin", "priceMax");
  swapIfInverted(filters, "kmMin", "kmMax");
  swapIfInverted(filters, "yearMin", "yearMax");
  swapIfInverted(filters, "seatsMin", "seatsMax");

  const unknownNames = unique(unmatched).filter(
    (name) => !warnings.some((warning) => warning.includes(name)),
  );
  if (unknownNames.length > 0) {
    warnings.push(
      `We don't list ${unknownNames.join(", ")}; showing the closest matches instead.`,
    );
  }

  return { filters, unmatched: unique(unmatched), warnings };
}

export function normalizeSort(raw: unknown): SearchSort | null {
  const result = searchSortSchema.safeParse(raw);
  if (!result.success || result.data.field === "relevance") return null;
  return result.data;
}

export function normalizeParse(
  raw: RawParse,
  query: string,
  vocabulary: Vocabulary,
  parser: Parser,
): ParsedQuery {
  const { filters, unmatched, warnings } = normalizeFilters(
    raw.filters,
    vocabulary,
  );

  const base =
    typeof raw.semanticQuery === "string" && raw.semanticQuery.trim().length > 0
      ? raw.semanticQuery.trim()
      : query;

  const semanticQuery = (
    unmatched.length > 0 ? `${base} ${unmatched.join(" ")}` : base
  ).slice(0, 500);

  return {
    isVehicleQuery: raw.isVehicleQuery !== false,
    hasSemanticIntent: raw.hasSemanticIntent !== false || unmatched.length > 0,
    semanticQuery,
    filters,
    sort: normalizeSort(raw.sort),
    notes: typeof raw.notes === "string" ? raw.notes.trim().slice(0, 300) : "",
    warnings,
    parser,
  };
}

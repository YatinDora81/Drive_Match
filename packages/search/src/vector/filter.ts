import type { SearchFilters } from "@repo/contracts";

type Condition = Record<string, unknown>;

export type QdrantFilter = {
  must?: Condition[];
  must_not?: Condition[];
};

const anyOf = (key: string, values: readonly string[]): Condition => ({
  key,
  match: { any: [...values] },
});

const range = (key: string, bounds: { gte?: number; lte?: number }): Condition => ({
  key,
  range: bounds,
});

const present = (values: readonly string[] | undefined): values is string[] =>
  Array.isArray(values) && values.length > 0;

export const SOFT_KEYS = ["features", "colors"] as const;

export function hasHardConstraints(filters: SearchFilters): boolean {
  return (Object.keys(filters) as Array<keyof SearchFilters>).some((key) => {
    if ((SOFT_KEYS as readonly string[]).includes(key)) return false;
    const value = filters[key];
    return Array.isArray(value)
      ? value.length > 0
      : value !== undefined && value !== null;
  });
}

export function buildQdrantFilter(filters: SearchFilters): QdrantFilter | null {
  const must: Condition[] = [];
  const mustNot: Condition[] = [];

  if (present(filters.bodyTypes)) must.push(anyOf("bodyType", filters.bodyTypes));
  if (present(filters.fuelTypes)) must.push(anyOf("fuelType", filters.fuelTypes));
  if (present(filters.transmissions)) {
    must.push(anyOf("transmission", filters.transmissions));
  }

  const identity: Condition[] = [];
  if (present(filters.makes)) identity.push(anyOf("make", filters.makes));
  if (present(filters.models)) identity.push(anyOf("model", filters.models));
  if (identity.length === 1) must.push(identity[0] as Condition);
  if (identity.length > 1) must.push({ should: identity });

  if (present(filters.cities)) must.push(anyOf("city", filters.cities));

  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    must.push(range("price", { gte: filters.priceMin, lte: filters.priceMax }));
  }
  if (filters.kmMin !== undefined || filters.kmMax !== undefined) {
    must.push(range("kmDriven", { gte: filters.kmMin, lte: filters.kmMax }));
  }
  if (filters.yearMin !== undefined || filters.yearMax !== undefined) {
    must.push(range("year", { gte: filters.yearMin, lte: filters.yearMax }));
  }
  if (filters.seatsMin !== undefined || filters.seatsMax !== undefined) {
    must.push(range("seats", { gte: filters.seatsMin, lte: filters.seatsMax }));
  }
  if (filters.safetyRatingMin !== undefined) {
    must.push(range("safetyRating", { gte: filters.safetyRatingMin }));
  }
  if (filters.ownerCountMax !== undefined) {
    must.push(range("ownerCount", { lte: filters.ownerCountMax }));
  }
  if (filters.mileageMin !== undefined) {
    must.push(range("mileageKmpl", { gte: filters.mileageMin }));
  }
  if (filters.rangeMin !== undefined) {
    must.push(range("rangeKm", { gte: filters.rangeMin }));
  }

  if (present(filters.excludeBodyTypes)) {
    mustNot.push(anyOf("bodyType", filters.excludeBodyTypes));
  }
  if (present(filters.excludeFuelTypes)) {
    mustNot.push(anyOf("fuelType", filters.excludeFuelTypes));
  }
  if (present(filters.excludeMakes))
    mustNot.push(anyOf("make", filters.excludeMakes));

  if (must.length === 0 && mustNot.length === 0) return null;

  return {
    ...(must.length > 0 ? { must } : {}),
    ...(mustNot.length > 0 ? { must_not: mustNot } : {}),
  };
}

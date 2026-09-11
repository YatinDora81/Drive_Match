import {
  formatInr,
  formatInrRange,
  formatKm,
  joinOr,
  labelEnum,
  labelEnumLower,
  sortLabel,
} from "./format";
import type { RelaxationStep, SearchFilters, SearchSort } from "./types";

export type FilterChip = {
  key: string;
  label: string;
  remove: () => SearchFilters;
};

type FilterKey = keyof SearchFilters;

function without(filters: SearchFilters, ...keys: FilterKey[]): SearchFilters {
  const next: SearchFilters = { ...filters };
  for (const key of keys) delete next[key];
  return next;
}

function dropFrom<T extends string>(
  list: T[] | undefined,
  item: string,
): T[] | undefined {
  const rest = (list ?? []).filter((entry) => entry !== item);
  return rest.length > 0 ? rest : undefined;
}

function withoutItem(
  filters: SearchFilters,
  key: "features" | "colors",
  item: string,
): SearchFilters {
  const next: SearchFilters = { ...filters };
  if (key === "features") {
    const rest = dropFrom(filters.features, item);
    if (rest) next.features = rest;
    else delete next.features;
  } else {
    const rest = dropFrom(filters.colors, item);
    if (rest) next.colors = rest;
    else delete next.colors;
  }
  return next;
}

export function isEmptyFilters(filters: SearchFilters | undefined): boolean {
  if (!filters) return true;
  return Object.values(filters).every(
    (value) => value === undefined || (Array.isArray(value) && value.length === 0),
  );
}

function priceLabel(
  min: number | undefined,
  max: number | undefined,
): string | null {
  if (min !== undefined && max !== undefined) return formatInrRange(min, max);
  if (max !== undefined) return `under ${formatInr(max)}`;
  if (min !== undefined) return `over ${formatInr(min)}`;
  return null;
}

function kmLabel(min: number | undefined, max: number | undefined): string | null {
  if (min !== undefined && max !== undefined)
    return `${formatKm(min).replace(" km", "")}–${formatKm(max)}`;
  if (max !== undefined) return `under ${formatKm(max)}`;
  if (min !== undefined) return `over ${formatKm(min)}`;
  return null;
}

function yearLabel(
  min: number | undefined,
  max: number | undefined,
): string | null {
  if (min !== undefined && max !== undefined)
    return min === max ? `${min}` : `${min}–${max}`;
  if (min !== undefined) return `${min} or newer`;
  if (max !== undefined) return `${max} or older`;
  return null;
}

function seatsLabel(
  min: number | undefined,
  max: number | undefined,
): string | null {
  if (min !== undefined && max !== undefined) {
    return min === max ? `${min} seats` : `${min}–${max} seats`;
  }
  if (min !== undefined) return `${min}+ seats`;
  if (max !== undefined) return `up to ${max} seats`;
  return null;
}

function starsLabel(min: number): string {
  return min >= 5 ? "5★" : `${min}★ and up`;
}

function ownersLabel(max: number): string {
  return max <= 1 ? "first owner" : `up to ${max} owners`;
}

export function chipsFromFilters(filters: SearchFilters): FilterChip[] {
  const chips: FilterChip[] = [];
  const push = (key: string, label: string | null, ...remove: FilterKey[]) => {
    if (label)
      chips.push({ key, label, remove: () => without(filters, ...remove) });
  };
  const list = (
    key: FilterKey,
    items: string[] | undefined,
    format: (item: string) => string,
    prefix = "",
  ) => {
    if (items && items.length > 0)
      push(key, `${prefix}${joinOr(items.map(format))}`, key);
  };

  list("makes", filters.makes, (m) => m);
  list("models", filters.models, (m) => m);
  list("bodyTypes", filters.bodyTypes, labelEnum);
  list("fuelTypes", filters.fuelTypes, labelEnum);
  list("transmissions", filters.transmissions, labelEnum);

  push(
    "price",
    priceLabel(filters.priceMin, filters.priceMax),
    "priceMin",
    "priceMax",
  );
  push("km", kmLabel(filters.kmMin, filters.kmMax), "kmMin", "kmMax");
  push("year", yearLabel(filters.yearMin, filters.yearMax), "yearMin", "yearMax");
  push(
    "seats",
    seatsLabel(filters.seatsMin, filters.seatsMax),
    "seatsMin",
    "seatsMax",
  );

  if (filters.safetyRatingMin !== undefined) {
    push("safety", starsLabel(filters.safetyRatingMin), "safetyRatingMin");
  }
  if (filters.ownerCountMax !== undefined) {
    push("owners", ownersLabel(filters.ownerCountMax), "ownerCountMax");
  }
  if (filters.mileageMin !== undefined) {
    push("mileage", `${filters.mileageMin}+ kmpl`, "mileageMin");
  }
  if (filters.rangeMin !== undefined) {
    push("range", `${formatKm(filters.rangeMin)} range or more`, "rangeMin");
  }

  list("cities", filters.cities, (c) => c, "in ");

  list("excludeBodyTypes", filters.excludeBodyTypes, labelEnumLower, "not ");
  list("excludeFuelTypes", filters.excludeFuelTypes, labelEnumLower, "not ");
  list("excludeMakes", filters.excludeMakes, (m) => m, "not ");

  for (const feature of filters.features ?? []) {
    chips.push({
      key: `feature:${feature}`,
      label: `prefers: ${feature}`,
      remove: () => withoutItem(filters, "features", feature),
    });
  }
  for (const color of filters.colors ?? []) {
    chips.push({
      key: `color:${color}`,
      label: `prefers: ${color.toLowerCase()}`,
      remove: () => withoutItem(filters, "colors", color),
    });
  }

  return chips;
}

export function sortChipLabel(sort: SearchSort): string {
  return sortLabel(sort);
}

const RANGE_PAIRS: ReadonlyArray<readonly [FilterKey, FilterKey]> = [
  ["priceMin", "priceMax"],
  ["kmMin", "kmMax"],
  ["yearMin", "yearMax"],
  ["seatsMin", "seatsMax"],
];

export function relaxedFields(step: RelaxationStep): FilterKey[] {
  if (step.to === undefined) {
    const pair = RANGE_PAIRS.find((keys) => keys.includes(step.field));
    if (pair) return [...pair];
  }
  return [step.field];
}

export function hardConstraintsIn(filters: SearchFilters): string[] {
  const hard: string[] = [];
  if (filters.fuelTypes?.length) hard.push("fuel");
  if (filters.transmissions?.length) hard.push("gearbox");
  if (filters.makes?.length) hard.push("make");
  if (filters.models?.length) hard.push("model");
  return hard;
}

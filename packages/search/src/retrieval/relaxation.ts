import { formatInr, formatKm } from "@repo/catalogue";
import type { RelaxationStep, SearchFilters } from "@repo/contracts";

export const MAX_RELAXATION_STEPS = 4;

type Rule = {
  code: string;
  applies: (filters: SearchFilters) => boolean;
  apply: (filters: SearchFilters) => { next: SearchFilters; step: RelaxationStep };
};

const inr = formatInr;
const km = formatKm;

const drop = (code: string, field: keyof SearchFilters, message: string): Rule => ({
  code,
  applies: (filters) => {
    const value = filters[field];
    return Array.isArray(value) ? value.length > 0 : value !== undefined;
  },
  apply: (filters) => {
    const { [field]: from, ...rest } = filters;
    return { next: rest, step: { code, field, from, message } };
  },
});

const dropPair = (
  code: string,
  fields: [keyof SearchFilters, keyof SearchFilters],
  message: string,
): Rule => ({
  code,
  applies: (filters) => fields.some((field) => filters[field] !== undefined),
  apply: (filters) => {
    const next = { ...filters };
    const from = {
      [fields[0]]: filters[fields[0]],
      [fields[1]]: filters[fields[1]],
    };
    delete next[fields[0]];
    delete next[fields[1]];
    return { next, step: { code, field: fields[0], from, message } };
  },
});

type NumericField =
  | "safetyRatingMin"
  | "ownerCountMax"
  | "seatsMin"
  | "yearMin"
  | "kmMax"
  | "priceMax"
  | "priceMin"
  | "rangeMin"
  | "mileageMin";

const notch = (
  code: string,
  field: NumericField,
  compute: (from: number) => number | null,
  label: (from: number, to: number) => string,
): Rule => ({
  code,
  applies: (filters) => {
    const from = filters[field];
    return from !== undefined && compute(from) !== null;
  },
  apply: (filters) => {
    const from = filters[field] as number;
    const to = compute(from) as number;
    return {
      next: { ...filters, [field]: to },
      step: { code, field, from, to, message: label(from, to) },
    };
  },
});

const roundTo = (value: number, unit: number): number =>
  Math.round(value / unit) * unit;

export const RELAXATION_LADDER: Rule[] = [
  drop("drop:cities", "cities", "Looked in every city"),
  notch(
    "widen:safetyRatingMin",
    "safetyRatingMin",
    (from) => (from > 3 ? from - 1 : null),
    (from, to) => `Accepted ${to}-star safety instead of ${from}-star`,
  ),
  notch(
    "widen:ownerCountMax",
    "ownerCountMax",
    (from) => (from < 3 ? from + 1 : null),
    (from, to) => `Included cars with up to ${to} owners instead of ${from}`,
  ),
  notch(
    "widen:seatsMin",
    "seatsMin",
    (from) => (from > 5 ? from - 1 : null),
    (from, to) => `Included ${to}-seaters as well as ${from}-seaters`,
  ),
  notch(
    "widen:yearMin",
    "yearMin",
    (from) => (from > 1991 ? Math.max(1990, from - 2) : null),
    (from, to) => `Included models from ${to} instead of ${from}`,
  ),
  notch(
    "widen:kmMax",
    "kmMax",
    (from) => Math.min(10_000_000, roundTo(from * 1.25, 1_000)),
    (from, to) => `Raised the odometer limit from ${km(from)} to ${km(to)}`,
  ),
  notch(
    "widen:priceMax",
    "priceMax",
    (from) => Math.min(1_000_000_000, roundTo(from * 1.15, 1_000)),
    (from, to) => `Widened the budget from ${inr(from)} to ${inr(to)}`,
  ),
  notch(
    "widen:priceMin",
    "priceMin",
    (from) => roundTo(from * 0.85, 1_000),
    (from, to) => `Lowered the price floor from ${inr(from)} to ${inr(to)}`,
  ),
  notch(
    "widen:rangeMin",
    "rangeMin",
    (from) => roundTo(from * 0.85, 10),
    (from, to) => `Accepted ${to} km of range instead of ${from} km`,
  ),
  notch(
    "widen:mileageMin",
    "mileageMin",
    (from) => Math.round((from - 3) * 10) / 10,
    (from, to) => `Accepted ${to} kmpl instead of ${from} kmpl`,
  ),
  dropPair("drop:seats", ["seatsMin", "seatsMax"], "Ignored the seat count"),
  dropPair("drop:year", ["yearMin", "yearMax"], "Ignored the model year"),
  drop("drop:safetyRatingMin", "safetyRatingMin", "Ignored the safety rating"),
  drop("drop:ownerCountMax", "ownerCountMax", "Ignored the owner count"),
  notch(
    "widen:kmMax:2",
    "kmMax",
    (from) => Math.min(10_000_000, roundTo(from * 1.25, 1_000)),
    (from, to) => `Raised the odometer limit again, to ${km(to)}`,
  ),
  notch(
    "widen:priceMax:2",
    "priceMax",
    (from) => Math.min(1_000_000_000, roundTo(from * 1.15, 1_000)),
    (from, to) => `Widened the budget again, to ${inr(to)}`,
  ),
  drop("drop:mileageMin", "mileageMin", "Ignored the fuel economy requirement"),
  drop("drop:rangeMin", "rangeMin", "Ignored the range requirement"),
  drop("drop:bodyTypes", "bodyTypes", "Included other body types"),
];

export async function relax(
  filters: SearchFilters,
  count: (filters: SearchFilters) => Promise<number>,
  maxSteps = MAX_RELAXATION_STEPS,
): Promise<{ filters: SearchFilters; steps: RelaxationStep[]; total: number }> {
  let current = filters;
  const steps: RelaxationStep[] = [];

  for (const rule of RELAXATION_LADDER) {
    if (steps.length >= maxSteps) break;
    if (!rule.applies(current)) continue;

    const { next, step } = rule.apply(current);
    steps.push(step);
    current = next;

    const total = await count(current);
    if (total > 0) return { filters: current, steps, total };
  }

  return { filters: current, steps, total: 0 };
}

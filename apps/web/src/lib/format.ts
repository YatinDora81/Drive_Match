import type {
  BodyType,
  FuelType,
  SearchSort,
  SortField,
  Transmission,
  Vehicle,
} from "./types";

export function groupIndian(value: number): string {
  const negative = value < 0;
  const digits = String(Math.round(Math.abs(value)));
  if (digits.length <= 3) return `${negative ? "-" : ""}${digits}`;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}${rest},${last3}`;
}

const trimZeros = (text: string): string => text.replace(/\.?0+$/, "");

type InrUnit = "" | "L" | "Cr";

export function inrParts(amount: number): { value: string; unit: InrUnit } {
  if (amount >= 1e7)
    return { value: trimZeros((amount / 1e7).toFixed(2)), unit: "Cr" };
  if (amount >= 1e5)
    return { value: trimZeros((amount / 1e5).toFixed(2)), unit: "L" };
  return { value: groupIndian(amount), unit: "" };
}

export function formatInr(amount: number): string {
  const { value, unit } = inrParts(amount);
  return unit ? `₹${value} ${unit}` : `₹${value}`;
}

export function formatInrRange(min: number, max: number): string {
  const lo = inrParts(min);
  const hi = inrParts(max);
  if (lo.unit === hi.unit && lo.unit !== "")
    return `₹${lo.value}–${hi.value} ${hi.unit}`;
  return `${formatInr(min)}–${formatInr(max)}`;
}

export const formatKm = (km: number): string => `${groupIndian(km)} km`;

export const formatCount = (count: number): string => groupIndian(count);

export function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

export const titleOf = (
  vehicle: Pick<Vehicle, "year" | "make" | "model">,
): string => `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

export function labelEnum(
  value: BodyType | FuelType | Transmission | string,
): string {
  if (value.length <= 3) return value.toUpperCase();
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function labelEnumLower(value: string): string {
  return value.length <= 3 ? value.toUpperCase() : value.toLowerCase();
}

export function joinOr(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} or ${items[items.length - 1]}`;
}

const SORT_LABELS: Record<SortField, { asc: string; desc: string }> = {
  price: { asc: "Cheapest first", desc: "Priciest first" },
  kmDriven: { asc: "Least driven first", desc: "Most driven first" },
  year: { asc: "Oldest first", desc: "Newest first" },
  safetyRating: { asc: "Lowest rated first", desc: "Safest first" },
  mileageKmpl: { asc: "Least efficient first", desc: "Most efficient first" },
  relevance: { asc: "Most relevant first", desc: "Most relevant first" },
};

export function sortLabel(sort: SearchSort): string {
  return SORT_LABELS[sort.field][sort.direction];
}

export const formatMs = (ms: number): string => `${groupIndian(Math.round(ms))} ms`;

export function plural(count: number, one: string, many = `${one}s`): string {
  return count === 1 ? one : many;
}

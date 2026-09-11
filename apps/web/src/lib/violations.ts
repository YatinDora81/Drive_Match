import { formatInr, formatKm, joinOr, labelEnum, plural } from "./format";
import type { SearchFilters, Vehicle } from "./types";

export type ViolationField =
  "price" | "km" | "city" | "safety" | "bodyType" | "year" | "seats" | "owners";

export type Violation = { field: ViolationField; caption: string };

const sameCity = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

export function violationsFor(
  vehicle: Vehicle,
  requested: SearchFilters,
): Violation[] {
  const out: Violation[] = [];

  if (requested.priceMax !== undefined && vehicle.price > requested.priceMax) {
    out.push({
      field: "price",
      caption: `${formatInr(vehicle.price - requested.priceMax)} over budget`,
    });
  } else if (
    requested.priceMin !== undefined &&
    vehicle.price < requested.priceMin
  ) {
    out.push({
      field: "price",
      caption: `${formatInr(requested.priceMin - vehicle.price)} under the minimum`,
    });
  }

  if (requested.kmMax !== undefined && vehicle.kmDriven > requested.kmMax) {
    out.push({
      field: "km",
      caption: `${formatKm(vehicle.kmDriven - requested.kmMax)} over the cap`,
    });
  }

  if (
    requested.cities?.length &&
    !requested.cities.some((c) => sameCity(c, vehicle.city))
  ) {
    out.push({ field: "city", caption: `outside ${joinOr(requested.cities)}` });
  }

  if (requested.safetyRatingMin !== undefined) {
    if (vehicle.safetyRating === null) {
      out.push({ field: "safety", caption: "safety not rated" });
    } else if (vehicle.safetyRating < requested.safetyRatingMin) {
      const short = requested.safetyRatingMin - vehicle.safetyRating;
      out.push({
        field: "safety",
        caption: `${short} ${plural(short, "star")} short`,
      });
    }
  }

  if (
    requested.bodyTypes?.length &&
    !requested.bodyTypes.includes(vehicle.bodyType)
  ) {
    out.push({
      field: "bodyType",
      caption: `wanted ${joinOr(requested.bodyTypes.map(labelEnum))}`,
    });
  }

  if (requested.yearMin !== undefined && vehicle.year < requested.yearMin) {
    const gap = requested.yearMin - vehicle.year;
    out.push({
      field: "year",
      caption: `${gap} ${plural(gap, "year")} older than asked`,
    });
  } else if (requested.yearMax !== undefined && vehicle.year > requested.yearMax) {
    out.push({ field: "year", caption: `newer than ${requested.yearMax}` });
  }

  if (requested.seatsMin !== undefined && vehicle.seats < requested.seatsMin) {
    out.push({ field: "seats", caption: `only ${vehicle.seats} seats` });
  }

  if (
    requested.ownerCountMax !== undefined &&
    vehicle.ownerCount > requested.ownerCountMax
  ) {
    out.push({ field: "owners", caption: `${vehicle.ownerCount} owners` });
  }

  return out;
}

export function violationMap(
  list: Violation[],
): Partial<Record<ViolationField, string>> {
  const map: Partial<Record<ViolationField, string>> = {};
  for (const item of list) map[item.field] = item.caption;
  return map;
}

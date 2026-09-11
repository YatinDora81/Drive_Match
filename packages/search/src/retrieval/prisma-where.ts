import type { SearchFilters, SearchSort } from "@repo/contracts";
import type { Prisma } from "@repo/db";

const present = (values: readonly string[] | undefined): values is string[] =>
  Array.isArray(values) && values.length > 0;

export function buildPrismaWhere(filters: SearchFilters): Prisma.VehicleWhereInput {
  const where: Prisma.VehicleWhereInput = {};
  const and: Prisma.VehicleWhereInput[] = [];

  if (present(filters.bodyTypes)) where.bodyType = { in: filters.bodyTypes };
  if (present(filters.fuelTypes)) where.fuelType = { in: filters.fuelTypes };
  if (present(filters.transmissions))
    where.transmission = { in: filters.transmissions };

  const identity: Prisma.VehicleWhereInput[] = [];
  if (present(filters.makes)) identity.push({ make: { in: filters.makes } });
  if (present(filters.models)) identity.push({ model: { in: filters.models } });
  if (identity.length === 1) and.push(identity[0] as Prisma.VehicleWhereInput);
  if (identity.length > 1) and.push({ OR: identity });

  if (present(filters.cities)) where.city = { in: filters.cities };

  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    where.price = { gte: filters.priceMin, lte: filters.priceMax };
  }
  if (filters.kmMin !== undefined || filters.kmMax !== undefined) {
    where.kmDriven = { gte: filters.kmMin, lte: filters.kmMax };
  }
  if (filters.yearMin !== undefined || filters.yearMax !== undefined) {
    where.year = { gte: filters.yearMin, lte: filters.yearMax };
  }
  if (filters.seatsMin !== undefined || filters.seatsMax !== undefined) {
    where.seats = { gte: filters.seatsMin, lte: filters.seatsMax };
  }
  if (filters.safetyRatingMin !== undefined) {
    where.safetyRating = { gte: filters.safetyRatingMin };
  }
  if (filters.ownerCountMax !== undefined)
    where.ownerCount = { lte: filters.ownerCountMax };
  if (filters.mileageMin !== undefined)
    where.mileageKmpl = { gte: filters.mileageMin };
  if (filters.rangeMin !== undefined) where.rangeKm = { gte: filters.rangeMin };

  const not: Prisma.VehicleWhereInput[] = [];
  if (present(filters.excludeBodyTypes)) {
    not.push({ bodyType: { in: filters.excludeBodyTypes } });
  }
  if (present(filters.excludeFuelTypes)) {
    not.push({ fuelType: { in: filters.excludeFuelTypes } });
  }
  if (present(filters.excludeMakes))
    not.push({ make: { in: filters.excludeMakes } });
  if (not.length > 0) where.NOT = not;

  if (and.length > 0) where.AND = and;

  return where;
}

export const DEFAULT_ORDER: Prisma.VehicleOrderByWithRelationInput[] = [
  { year: "desc" },
  { kmDriven: "asc" },
  { ownerCount: "asc" },
  { id: "asc" },
];

export function buildOrderBy(
  sort: SearchSort | null,
): Prisma.VehicleOrderByWithRelationInput[] {
  if (!sort || sort.field === "relevance") return DEFAULT_ORDER;

  const nullable = sort.field === "safetyRating" || sort.field === "mileageKmpl";
  const primary: Prisma.VehicleOrderByWithRelationInput = nullable
    ? { [sort.field]: { sort: sort.direction, nulls: "last" } }
    : { [sort.field]: sort.direction };

  return [primary, { id: "asc" }];
}

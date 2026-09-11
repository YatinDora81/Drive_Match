import {
  AppError,
  type Facets,
  type FacetBucket,
  type ListVehiclesInput,
  type SearchFilters,
  type Vehicle,
} from "@repo/contracts";
import { db, type Prisma } from "@repo/db";
import { buildOrderBy, buildPrismaWhere } from "@repo/search";
import { decodeCursor, encodeCursor } from "../lib/cursor.ts";
import { toVehicleDto } from "../lib/dto.ts";

const FACETS_TTL_MS = 60_000;

type Anchor = {
  id: string;
  price: number;
  kmDriven: number;
  year: number;
  safetyRating: number | null;
  mileageKmpl: number | null;
};

const NULLABLE: ReadonlySet<string> = new Set(["safetyRating", "mileageKmpl"]);

class VehicleService {
  private facetsCache: { value: Facets; expiresAt: number } | null = null;

  list = async (
    input: ListVehiclesInput,
  ): Promise<{ data: Vehicle[]; nextCursor: string | null }> => {
    const filters = this.toFilters(input);
    const where = buildPrismaWhere(filters);
    const orderBy = buildOrderBy({ field: input.sort, direction: input.order });

    const after = input.cursor
      ? await this.anchor(decodeCursor(input.cursor, input.sort, input.order).id)
      : null;

    const rows = await db.vehicle.findMany({
      where: after ? { AND: [where, this.afterAnchor(after, input)] } : where,
      orderBy,
      take: input.limit + 1,
    });

    const hasMore = rows.length > input.limit;
    const page = hasMore ? rows.slice(0, input.limit) : rows;
    const last = page[page.length - 1];

    return {
      data: page.map(toVehicleDto),
      nextCursor:
        hasMore && last
          ? encodeCursor({ id: last.id, sort: input.sort, order: input.order })
          : null,
    };
  };

  get = async (id: string): Promise<Vehicle> => {
    const row = await db.vehicle.findUnique({ where: { id } });
    if (!row) throw new AppError("NOT_FOUND", "Vehicle not found");
    return toVehicleDto(row);
  };

  facets = async (): Promise<Facets> => {
    if (this.facetsCache && this.facetsCache.expiresAt > Date.now()) {
      return this.facetsCache.value;
    }

    const rows = await db.vehicle.findMany({
      select: {
        make: true,
        model: true,
        bodyType: true,
        fuelType: true,
        transmission: true,
        city: true,
        color: true,
        features: true,
        price: true,
        kmDriven: true,
        year: true,
      },
    });

    const tally = (values: string[]): FacetBucket[] => {
      const counts = new Map<string, number>();
      for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
      return [...counts.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
    };

    const range = (values: number[]): { min: number; max: number } =>
      values.length === 0
        ? { min: 0, max: 0 }
        : { min: Math.min(...values), max: Math.max(...values) };

    const value: Facets = {
      total: rows.length,
      makes: tally(rows.map((row) => row.make)),
      models: tally(rows.map((row) => row.model)),
      bodyTypes: tally(rows.map((row) => row.bodyType)),
      fuelTypes: tally(rows.map((row) => row.fuelType)),
      transmissions: tally(rows.map((row) => row.transmission)),
      cities: tally(rows.map((row) => row.city)),
      colors: tally(rows.map((row) => row.color)),
      features: tally(rows.flatMap((row) => row.features)),
      price: range(rows.map((row) => row.price)),
      kmDriven: range(rows.map((row) => row.kmDriven)),
      year: range(rows.map((row) => row.year)),
    };

    this.facetsCache = { value, expiresAt: Date.now() + FACETS_TTL_MS };
    return value;
  };

  private toFilters = (input: ListVehiclesInput): SearchFilters => ({
    ...(input.bodyType?.length ? { bodyTypes: input.bodyType } : {}),
    ...(input.fuelType?.length ? { fuelTypes: input.fuelType } : {}),
    ...(input.transmission?.length ? { transmissions: input.transmission } : {}),
    ...(input.make?.length ? { makes: input.make } : {}),
    ...(input.model?.length ? { models: input.model } : {}),
    ...(input.city?.length ? { cities: input.city } : {}),
    ...(input.priceMin !== undefined ? { priceMin: input.priceMin } : {}),
    ...(input.priceMax !== undefined ? { priceMax: input.priceMax } : {}),
    ...(input.kmMax !== undefined ? { kmMax: input.kmMax } : {}),
    ...(input.yearMin !== undefined ? { yearMin: input.yearMin } : {}),
    ...(input.yearMax !== undefined ? { yearMax: input.yearMax } : {}),
    ...(input.seatsMin !== undefined ? { seatsMin: input.seatsMin } : {}),
    ...(input.safetyRatingMin !== undefined
      ? { safetyRatingMin: input.safetyRatingMin }
      : {}),
  });

  private anchor = async (id: string): Promise<Anchor> => {
    const row = await db.vehicle.findUnique({
      where: { id },
      select: {
        id: true,
        price: true,
        kmDriven: true,
        year: true,
        safetyRating: true,
        mileageKmpl: true,
      },
    });

    if (!row) {
      throw new AppError(
        "VALIDATION_ERROR",
        "That page cursor no longer exists, start again from the first page",
      );
    }

    return row;
  };

  private afterAnchor = (
    anchor: Anchor,
    input: ListVehiclesInput,
  ): Prisma.VehicleWhereInput => {
    const field = input.sort;
    const value = anchor[field];
    const beyond = input.order === "asc" ? "gt" : "lt";

    if (value === null) {
      return { [field]: null, id: { gt: anchor.id } };
    }

    const conditions: Prisma.VehicleWhereInput[] = [
      { [field]: { [beyond]: value } },
      { [field]: value, id: { gt: anchor.id } },
    ];

    if (NULLABLE.has(field)) conditions.push({ [field]: null });

    return { OR: conditions };
  };
}

export default new VehicleService();

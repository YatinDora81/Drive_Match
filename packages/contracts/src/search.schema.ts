import { z } from "zod";
import {
  bodyTypeSchema,
  featureSchema,
  fuelTypeSchema,
  sortDirectionSchema,
  sortFieldSchema,
  transmissionSchema,
} from "./vehicle.ts";

const money = z.number().int().min(0).max(1_000_000_000);
const km = z.number().int().min(0).max(10_000_000);
const year = z.number().int().min(1990).max(2100);
const shortList = (max = 10) => z.array(z.string().trim().min(1).max(60)).max(max);

export const searchFiltersSchema = z
  .object({
    bodyTypes: z.array(bodyTypeSchema).max(6).optional(),
    fuelTypes: z.array(fuelTypeSchema).max(5).optional(),
    transmissions: z.array(transmissionSchema).max(2).optional(),
    makes: shortList().optional(),
    models: shortList().optional(),
    cities: shortList().optional(),
    colors: shortList().optional(),
    features: z.array(featureSchema).max(10).optional(),
    excludeBodyTypes: z.array(bodyTypeSchema).max(6).optional(),
    excludeFuelTypes: z.array(fuelTypeSchema).max(5).optional(),
    excludeMakes: shortList().optional(),
    priceMin: money.optional(),
    priceMax: money.optional(),
    kmMin: km.optional(),
    kmMax: km.optional(),
    yearMin: year.optional(),
    yearMax: year.optional(),
    seatsMin: z.number().int().min(2).max(10).optional(),
    seatsMax: z.number().int().min(2).max(10).optional(),
    safetyRatingMin: z.number().int().min(0).max(5).optional(),
    ownerCountMax: z.number().int().min(1).max(10).optional(),
    mileageMin: z.number().min(0).max(100).optional(),
    rangeMin: z.number().int().min(0).max(2000).optional(),
  })
  .strict();

export const searchSortSchema = z
  .object({
    field: sortFieldSchema,
    direction: sortDirectionSchema,
  })
  .strict();

export const searchRequestSchema = z
  .object({
    query: z.string().trim().min(2).max(500),
    limit: z.coerce.number().int().min(1).max(50).optional(),
    offset: z.coerce.number().int().min(0).max(500).default(0),
    explain: z.boolean().default(false),
    filters: searchFiltersSchema.optional(),
    semanticQuery: z.string().trim().min(1).max(500).optional(),
    hasSemanticIntent: z.boolean().optional(),
    sort: searchSortSchema.nullable().optional(),
  })
  .strict();

export const parseRequestSchema = z
  .object({
    query: z.string().trim().min(2).max(500),
  })
  .strict();

const csv = <T extends z.ZodType>(item: T) =>
  z.preprocess((value) => {
    const raw = Array.isArray(value)
      ? value
      : typeof value === "string"
        ? [value]
        : [];
    return raw
      .flatMap((entry) => (typeof entry === "string" ? entry.split(",") : []))
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }, z.array(item).max(10));

export const listVehiclesSchema = z.object({
  bodyType: csv(bodyTypeSchema).optional(),
  fuelType: csv(fuelTypeSchema).optional(),
  transmission: csv(transmissionSchema).optional(),
  make: csv(z.string().trim().min(1).max(60)).optional(),
  model: csv(z.string().trim().min(1).max(60)).optional(),
  city: csv(z.string().trim().min(1).max(60)).optional(),
  priceMin: z.coerce.number().int().min(0).optional(),
  priceMax: z.coerce.number().int().min(0).optional(),
  kmMax: z.coerce.number().int().min(0).optional(),
  yearMin: z.coerce.number().int().min(1990).optional(),
  yearMax: z.coerce.number().int().max(2100).optional(),
  seatsMin: z.coerce.number().int().min(2).max(10).optional(),
  safetyRatingMin: z.coerce.number().int().min(0).max(5).optional(),
  sort: sortFieldSchema.exclude(["relevance"]).default("price"),
  order: sortDirectionSchema.default("asc"),
  cursor: z.string().min(1).max(500).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const vehicleIdSchema = z.object({
  id: z.uuid("invalid vehicle id"),
});

export type SearchFilters = z.infer<typeof searchFiltersSchema>;
export type SearchSort = z.infer<typeof searchSortSchema>;
export type SearchRequest = z.infer<typeof searchRequestSchema>;
export type ListVehiclesInput = z.infer<typeof listVehiclesSchema>;

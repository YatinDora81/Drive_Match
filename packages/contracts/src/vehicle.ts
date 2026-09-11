import { z } from "zod";

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

export type Feature = (typeof FEATURES)[number];

export const SORT_FIELDS = [
  "price",
  "kmDriven",
  "year",
  "safetyRating",
  "mileageKmpl",
  "relevance",
] as const;

export const bodyTypeSchema = z.enum(BODY_TYPES);
export const fuelTypeSchema = z.enum(FUEL_TYPES);
export const transmissionSchema = z.enum(TRANSMISSIONS);
export const sortFieldSchema = z.enum(SORT_FIELDS);
export const featureSchema = z.enum(FEATURES);
export const sortDirectionSchema = z.enum(["asc", "desc"]);

export type BodyType = z.infer<typeof bodyTypeSchema>;
export type FuelType = z.infer<typeof fuelTypeSchema>;
export type Transmission = z.infer<typeof transmissionSchema>;
export type SortField = z.infer<typeof sortFieldSchema>;
export type SortDirection = z.infer<typeof sortDirectionSchema>;

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

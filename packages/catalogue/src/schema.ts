import { z } from "zod";
import {
  bodyTypeSchema,
  featureSchema,
  fuelTypeSchema,
  transmissionSchema,
} from "@repo/contracts";

export const catalogueVehicleSchema = z.object({
  id: z.uuidv4(),
  make: z.string().min(1),
  model: z.string().min(1),
  variant: z.string().min(1),
  year: z.number().int().min(2000).max(2100),
  bodyType: bodyTypeSchema,
  fuelType: fuelTypeSchema,
  transmission: transmissionSchema,
  price: z.number().int().positive(),
  kmDriven: z.number().int().nonnegative(),
  ownerCount: z.number().int().min(1).max(5),
  seats: z.number().int().min(2).max(9),
  safetyRating: z.number().int().min(0).max(5).nullable(),
  mileageKmpl: z.number().positive().nullable(),
  rangeKm: z.number().int().positive().nullable(),
  engineCc: z.number().int().positive().nullable(),
  batteryKwh: z.number().positive().nullable(),
  powerBhp: z.number().int().positive().nullable(),
  color: z.string().min(1),
  city: z.string().min(1),
  registrationState: z.string().length(2),
  features: z.array(featureSchema),
  description: z.string().min(1),
});

export const catalogueSchema = z.array(catalogueVehicleSchema);

import vehicles from "../data/vehicles.json";
import { catalogueSchema } from "./schema.ts";
import type { CatalogueVehicle } from "./types.ts";

export { describeVehicle, titleOf } from "./describe.ts";
export { formatInr, formatKm, formatLakh } from "./format.ts";
export { generateCatalogue, type CatalogueOptions } from "./generator.ts";
export {
  MODELS,
  type Engine,
  type GearboxOption,
  type ModelLine,
  type Tier,
} from "./models.ts";
export { catalogueSchema, catalogueVehicleSchema } from "./schema.ts";
export type { CatalogueVehicle } from "./types.ts";
export {
  CITIES,
  COLORS,
  MAKES,
  MODEL_ALIASES,
  type City,
  type Color,
  type ModelAlias,
} from "./vocabulary.ts";

export function loadCatalogue(): CatalogueVehicle[] {
  return catalogueSchema.parse(vehicles);
}

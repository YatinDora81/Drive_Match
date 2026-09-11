import type { Vehicle } from "@repo/contracts";

export type CatalogueVehicle = Omit<
  Vehicle,
  "createdAt" | "updatedAt" | "indexedAt"
>;

export type Draft = Omit<CatalogueVehicle, "features" | "description">;

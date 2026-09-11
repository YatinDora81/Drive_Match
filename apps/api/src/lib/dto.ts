import type { Vehicle } from "@repo/contracts";
import type { Vehicle as VehicleRow } from "@repo/db";

export function toVehicleDto(row: VehicleRow): Vehicle {
  return {
    id: row.id,
    make: row.make,
    model: row.model,
    variant: row.variant,
    year: row.year,
    bodyType: row.bodyType,
    fuelType: row.fuelType,
    transmission: row.transmission,
    price: row.price,
    kmDriven: row.kmDriven,
    ownerCount: row.ownerCount,
    seats: row.seats,
    safetyRating: row.safetyRating ?? null,
    mileageKmpl: row.mileageKmpl ?? null,
    rangeKm: row.rangeKm ?? null,
    engineCc: row.engineCc ?? null,
    batteryKwh: row.batteryKwh ?? null,
    powerBhp: row.powerBhp ?? null,
    color: row.color,
    city: row.city,
    registrationState: row.registrationState,
    features: row.features,
    description: row.description,
    indexedAt: row.indexedAt ? row.indexedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

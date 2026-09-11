import { formatKm, formatLakh } from "./format.ts";
import type { CatalogueVehicle } from "./types.ts";
import { bodyWord, capitalize, fuelWord, ownerWord } from "./words.ts";

export const titleOf = (v: CatalogueVehicle): string =>
  `${v.year} ${v.make} ${v.model} ${v.variant}`;

export function describeVehicle(v: CatalogueVehicle): string {
  const facts = [
    bodyWord(v.bodyType),
    `${fuelWord(v.fuelType)} ${v.transmission === "AUTOMATIC" ? "automatic" : "manual"}`,
    v.seats >= 6 ? `${v.seats} seater family` : `${v.seats} seater`,
    `priced at ${formatLakh(v.price)}`,
    `${formatKm(v.kmDriven)} driven`,
    `${ownerWord(v.ownerCount)} owner`,
    v.safetyRating === null
      ? "safety rating not tested"
      : `${v.safetyRating}-star NCAP safety rating`,
    ...drivetrain(v),
    `${v.color} colour`,
    `registered in ${v.city} (${v.registrationState})`,
  ];

  const features =
    v.features.length > 0 ? `Features: ${v.features.join(", ")}.` : "";

  return [
    `${titleOf(v)}.`,
    `${capitalize(facts.join(", "))}.`,
    features,
    v.description,
  ]
    .filter(Boolean)
    .join(" ");
}

function drivetrain(v: CatalogueVehicle): string[] {
  const parts: string[] = [];

  if (v.engineCc !== null) parts.push(`${v.engineCc} cc engine`);
  if (v.powerBhp !== null) parts.push(`${v.powerBhp} bhp`);
  if (v.batteryKwh !== null) parts.push(`${v.batteryKwh} kWh battery`);
  if (v.rangeKm !== null) parts.push(`${v.rangeKm} km electric range`);
  if (v.mileageKmpl !== null) parts.push(`${v.mileageKmpl} kmpl fuel economy`);

  return parts;
}

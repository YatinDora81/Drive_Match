import type { Feature } from "@repo/contracts";
import { formatKm } from "./format.ts";
import { CATALOGUE_YEAR, type Tier, type TrimLevel } from "./models.ts";
import type { Rng } from "./random.ts";
import type { Draft } from "./types.ts";
import { bodyWord, capitalize, fuelWord, ownerWord } from "./words.ts";

export type ListingContext = { tier: Tier; level: TrimLevel; offRoad: boolean };

type Phrases = readonly string[];

const OPENINGS: readonly ((v: Draft) => string)[] = [
  (v) =>
    `${v.year} ${v.make} ${v.model} ${v.variant} in ${v.color}, ${ownerWord(v.ownerCount)} owner, ${formatKm(v.kmDriven)}, registered in ${v.city}.`,
  (v) =>
    `${capitalize(ownerWord(v.ownerCount))}-owner ${v.color} ${v.make} ${v.model} ${v.variant} (${v.year}) with ${formatKm(v.kmDriven)} on the odometer, ${v.city} registration.`,
  (v) =>
    `Well-kept ${v.year} ${v.model} ${v.variant} in ${v.color}, ${formatKm(v.kmDriven)}, ${ownerWord(v.ownerCount)} owner, ${v.city}.`,
  (v) =>
    `${v.make} ${v.model} ${v.variant}, ${v.year} model, ${v.color}, ${formatKm(v.kmDriven)} driven by ${ownerWord(v.ownerCount)} owner in ${v.city}.`,
];

export function composeDescription(
  rng: Rng,
  vehicle: Draft,
  context: ListingContext,
  features: readonly Feature[],
): string {
  const opening = rng.pick(OPENINGS)(vehicle);
  const candidates = rng.shuffle(signalsFor(vehicle, context, features));
  const count = rng.chance(0.6) ? 2 : 1;
  const sentences = candidates.slice(0, count).map((phrases) => rng.pick(phrases));

  return [opening, ...sentences].join(" ");
}

function signalsFor(
  v: Draft,
  context: ListingContext,
  features: readonly Feature[],
): Phrases[] {
  const out: Phrases[] = [];
  const body = bodyWord(v.bodyType);
  const luxury = context.tier === "luxury";
  const bhp = v.powerBhp ?? 0;
  const age = CATALOGUE_YEAR - v.year;

  if (v.seats >= 7) {
    out.push([
      `Spacious ${v.seats}-seater that is perfect for family trips and long drives.`,
      `A proper family car with three rows and room for ${v.seats}.`,
      `Roomy ${v.seats} seater, ideal for a big family and weekend getaways.`,
    ]);
  }

  if (v.seats === 6) {
    out.push([
      `6-seater with captain seats in the middle row, a comfortable family ${body}.`,
      `Captain seats and three rows make it a premium family ${body}.`,
    ]);
  }

  if (v.safetyRating === 5) {
    out.push([
      "5-star NCAP rated, one of the safest cars in its class.",
      "Safe choice for the family with a 5-star NCAP safety rating.",
    ]);
  } else if (v.safetyRating === 4) {
    out.push([
      "4-star NCAP rated, a safe and solid pick.",
      "Safe, sturdy build with a 4-star crash test rating.",
    ]);
  }

  if (v.fuelType === "CNG") {
    out.push([
      "Factory-fitted CNG keeps the running cost very low, ideal for daily city commute.",
      "Low running cost with dual-fuel CNG, a budget-friendly daily driver.",
    ]);
  } else if (v.fuelType === "ELECTRIC") {
    out.push([
      `Electric with ${v.rangeKm} km range, near-zero running cost and zero tailpipe emissions.`,
      `Silent, peppy electric drive with ${v.rangeKm} km range and very low running cost.`,
    ]);
  } else if (v.fuelType === "HYBRID") {
    out.push([
      `Strong hybrid returning ${v.mileageKmpl} kmpl, fuel efficient and effortless in the city.`,
    ]);
  } else if ((v.mileageKmpl ?? 0) >= 21) {
    out.push([
      `Fuel efficient at ${v.mileageKmpl} kmpl, so running costs stay low.`,
      `Very economical ${fuelWord(v.fuelType)} engine with low running cost.`,
    ]);
  }

  if (context.offRoad) {
    out.push([
      "Built for off-road adventures as much as highway cruising.",
      "Rugged off-roader that is equally at home on long drives.",
    ]);
  }

  if (v.price < 500_000) {
    out.push(
      v.bodyType === "HATCHBACK"
        ? [
            "Budget-friendly, easy to park and drive, an ideal first car.",
            "Ideal first car for city use on a tight budget.",
          ]
        : ["Great value budget pick."],
    );
  }

  if (v.year >= 2023 && v.kmDriven < 15_000) {
    out.push([
      `Almost new with barely ${formatKm(v.kmDriven)} on the clock.`,
      "Practically showroom fresh with very low kilometres.",
    ]);
  }

  if (luxury) {
    out.push([
      `Premium ${body} with a plush cabin and effortless performance.`,
      "Luxury badge, refined ride and a premium feel inside out.",
    ]);
  } else if (context.tier === "premium" && context.level === "top") {
    out.push(["Fully loaded top variant with a premium cabin."]);
  }

  if (!luxury && bhp >= 140 && v.bodyType !== "MPV" && v.seats <= 5) {
    out.push([
      "Peppy engine that enthusiasts will love.",
      "Punchy performance for the enthusiast driver.",
    ]);
  }

  if (v.bodyType !== "HATCHBACK" && bhp >= 100 && context.tier !== "budget") {
    out.push([
      "A comfortable highway cruiser, great for long drives.",
      "Composed highway cruiser for long family drives.",
    ]);
  }

  if (v.bodyType === "HATCHBACK" || (v.bodyType === "SUV" && v.price < 800_000)) {
    out.push(
      v.transmission === "AUTOMATIC"
        ? ["Hassle-free automatic that makes city commute effortless."]
        : [
            "Compact and nimble, perfect for city commute.",
            "Easy to drive in traffic and great for daily city commute.",
          ],
    );
  }

  if (age > 0 && v.kmDriven < age * 8_000) {
    out.push([
      "Well maintained with complete service history and low kilometres.",
      "Meticulously maintained, all services done at the authorised workshop.",
    ]);
  }

  if (v.ownerCount === 1) {
    out.push([
      "Single owner, accident-free and well maintained.",
      "First owner car with all original documents.",
    ]);
  }

  const [first, second] = features;
  if (first && second) out.push([`Highlights include ${first} and ${second}.`]);

  return out;
}

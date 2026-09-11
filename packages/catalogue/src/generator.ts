import { BODY_TYPES, type BodyType, type FuelType } from "@repo/contracts";
import { pickFeatures } from "./features.ts";
import { composeDescription } from "./listing.ts";
import {
  CATALOGUE_YEAR,
  MODELS,
  type Engine,
  type Gearbox,
  type ModelLine,
  type TrimLevel,
} from "./models.ts";
import { at, createRng, uuidFrom, type Rng } from "./random.ts";
import type { CatalogueVehicle, Draft } from "./types.ts";
import { CITIES, COLORS, type CityName, type Color } from "./vocabulary.ts";

export type CatalogueOptions = { seed?: number; count?: number };

export const DEFAULT_SEED = 2024;
export const DEFAULT_COUNT = 320;

const BODY_MIX: Record<BodyType, number> = {
  SUV: 38,
  HATCHBACK: 25,
  SEDAN: 20,
  MPV: 12,
  COUPE: 3,
  PICKUP: 3,
};

const YEAR_MIX: readonly (readonly [number, number])[] = [
  [2015, 3],
  [2016, 4],
  [2017, 6],
  [2018, 9],
  [2019, 10],
  [2020, 10],
  [2021, 11],
  [2022, 13],
  [2023, 12],
  [2024, 7],
  [2025, 3],
];

const OWNER_MIX: readonly (readonly [number, number])[] = [
  [1, 65],
  [2, 28],
  [3, 7],
];

const COLOR_MIX: Record<Color, number> = {
  white: 35,
  silver: 14,
  grey: 12,
  black: 9,
  blue: 8,
  red: 7,
  brown: 4,
  beige: 3,
  orange: 2,
  green: 2,
  maroon: 2,
  yellow: 2,
};

const CITY_MIX: Record<CityName, number> = {
  Delhi: 12,
  Mumbai: 11,
  Bengaluru: 11,
  Hyderabad: 9,
  Pune: 8,
  Chennai: 8,
  Gurugram: 8,
  Ahmedabad: 6,
  Kolkata: 5,
  Jaipur: 5,
  Lucknow: 5,
  Chandigarh: 4,
  Kochi: 4,
  Indore: 4,
};

const AUTOMATIC_SHARE = { budget: 0.4, mass: 0.55, premium: 0.75, luxury: 0.95 };

const HIGH_USE_SHARE = 0.12;

const MAX_KM = 250_000;

const FUEL_WORD: Record<FuelType, string> = {
  PETROL: "Petrol",
  DIESEL: "Diesel",
  CNG: "CNG",
  HYBRID: "Hybrid",
  ELECTRIC: "",
};

type Trim = { name: string; level: TrimLevel; position: number };

type City = (typeof CITIES)[number];

export function generateCatalogue(
  options: CatalogueOptions = {},
): CatalogueVehicle[] {
  const rng = createRng(options.seed ?? DEFAULT_SEED);
  const count = options.count ?? DEFAULT_COUNT;
  const years = apportion(rng, YEAR_MIX, count);
  const bodies = apportion(
    rng,
    BODY_TYPES.map((body): readonly [BodyType, number] => [body, BODY_MIX[body]]),
    count,
  );
  const cities = apportion(
    rng,
    CITIES.map((city): readonly [City, number] => [city, CITY_MIX[city.name]]),
    count,
  );

  return years.map((year, index) =>
    generateVehicle(rng, year, at(bodies, index), at(cities, index)),
  );
}

function apportion<T>(
  rng: Rng,
  mix: readonly (readonly [T, number])[],
  count: number,
): T[] {
  const total = mix.reduce((sum, [, weight]) => sum + weight, 0);
  const shares = mix.map(([item, weight]) => {
    const exact = (weight / total) * count;
    return { item, whole: Math.floor(exact), remainder: exact % 1 };
  });
  const missing = count - shares.reduce((sum, { whole }) => sum + whole, 0);
  const byRemainder = [...shares].sort((a, b) => b.remainder - a.remainder);

  for (const share of byRemainder.slice(0, missing)) share.whole += 1;

  return rng.shuffle(
    shares.flatMap(({ item, whole }) => Array.from({ length: whole }, () => item)),
  );
}

function generateVehicle(
  rng: Rng,
  year: number,
  body: BodyType,
  city: City,
): CatalogueVehicle {
  const id = uuidFrom(rng);
  const line = pickLine(rng, year, body);
  const trim = pickTrim(rng, trimsFor(line, year));
  const engine = rng.pick(enginesFor(line, year, trim));
  const gearbox = pickGearbox(rng, gearboxesFor(engine, year), line, trim);
  const seats = rng.pick(line.seatsByTrim?.[trim.name] ?? line.seats);
  const age = CATALOGUE_YEAR - year;
  const ownerCount = pickOwners(rng, age);
  const kmDriven = pickKm(rng, age);
  const price = usedPrice(rng, { line, engine, trim, age, kmDriven, ownerCount });
  const color = rng.weighted(COLORS, (candidate) => COLOR_MIX[candidate]);

  const draft: Draft = {
    id,
    make: line.make,
    model: line.model,
    variant: variantName(engine, trim.name, gearbox),
    year,
    bodyType: line.bodyType,
    fuelType: engine.fuel,
    transmission: gearbox === "MT" ? "MANUAL" : "AUTOMATIC",
    price,
    kmDriven,
    ownerCount,
    seats,
    safetyRating: safetyFor(line, year),
    mileageKmpl: engine.kmpl,
    rangeKm: engine.rangeKm,
    engineCc: engine.cc,
    batteryKwh: engine.batteryKwh,
    powerBhp: engine.bhp,
    color,
    city: city.name,
    registrationState: city.state,
  };

  const features = pickFeatures(rng, {
    ...draft,
    tier: line.tier,
    level: trim.level,
    never: line.never ?? [],
    featureFrom: line.featureFrom ?? {},
  });
  const description = composeDescription(
    rng,
    draft,
    { tier: line.tier, level: trim.level, offRoad: line.offRoad ?? false },
    features,
  );

  return { ...draft, features, description };
}

function pickLine(rng: Rng, year: number, body: BodyType): ModelLine {
  const onSale = MODELS.filter((line) => soldIn(line, year));
  const ofBody = onSale.filter((line) => line.bodyType === body);

  if (ofBody.length > 0) return rng.weighted(ofBody, (line) => line.weight);

  const bodyWeight = new Map<BodyType, number>();

  for (const line of onSale) {
    bodyWeight.set(
      line.bodyType,
      (bodyWeight.get(line.bodyType) ?? 0) + line.weight,
    );
  }

  return rng.weighted(
    onSale,
    (line) =>
      (line.weight * BODY_MIX[line.bodyType]) /
      (bodyWeight.get(line.bodyType) ?? 1),
  );
}

const soldIn = (line: ModelLine, year: number): boolean =>
  within(line.years, year) && !(line.offSale && within(line.offSale, year));

const within = (
  years: readonly [number, number] | undefined,
  year: number,
): boolean => !years || (year >= years[0] && year <= years[1]);

const trimsFor = (line: ModelLine, year: number): readonly string[] =>
  line.trimsBefore && year < line.trimsBefore.year
    ? line.trimsBefore.trims
    : line.trims;

function enginesFor(line: ModelLine, year: number, trim: Trim): readonly Engine[] {
  const onSale = line.engines.filter((engine) => within(engine.years, year));
  const suited = line.automaticOnly?.includes(trim.name)
    ? onSale.filter((engine) => hasAutomatic(engine, year))
    : trim.level === "base" && !line.baseAutomatic
      ? onSale.filter((engine) => gearboxesFor(engine, year).includes("MT"))
      : onSale;

  return (
    [suited, onSale, line.engines].find((set) => set.length > 0) ?? line.engines
  );
}

const hasAutomatic = (engine: Engine, year: number): boolean =>
  engine.fuel === "ELECTRIC" ||
  gearboxesFor(engine, year).some((gearbox) => gearbox !== "MT");

export const gearboxesFor = (engine: Engine, year: number): Gearbox[] =>
  engine.gearboxes
    .filter((option) => typeof option === "string" || within(option.years, year))
    .map((option) => (typeof option === "string" ? option : option.box));

const levelOf = (index: number, last: number): TrimLevel =>
  index === last ? "top" : index === 0 ? "base" : "mid";

function pickTrim(rng: Rng, trims: readonly string[]): Trim {
  const last = trims.length - 1;
  const options = trims.map((name, index) => ({
    name,
    level: levelOf(index, last),
    position: last === 0 ? 0.5 : index / last,
  }));

  return rng.weighted(options, ({ level }) =>
    level === "base" ? 20 : level === "top" ? 40 : 40 / Math.max(last - 1, 1),
  );
}

function pickGearbox(
  rng: Rng,
  options: readonly Gearbox[],
  line: ModelLine,
  trim: Trim,
): Gearbox | null {
  const manual = options.find((gearbox) => gearbox === "MT");
  const automatics = options.filter((gearbox) => gearbox !== "MT");

  if (automatics.length === 0) return manual ?? null;
  if (!manual || line.automaticOnly?.includes(trim.name))
    return rng.pick(automatics);
  if (trim.level === "base" && !line.baseAutomatic) return manual;

  return rng.chance(AUTOMATIC_SHARE[line.tier]) ? rng.pick(automatics) : manual;
}

function pickOwners(rng: Rng, age: number): number {
  const most = age === 0 ? 1 : age < 3 ? 2 : 3;
  const [ownerCount] = rng.weighted(OWNER_MIX, ([owners, weight]) =>
    owners === 1 ? weight : owners <= most ? weight * Math.min(1, age / 4) : 0,
  );

  return ownerCount;
}

function pickKm(rng: Rng, age: number): number {
  if (age === 0) return Math.round(rng.between(1_500, 9_000) / 100) * 100;

  const perYear = rng.chance(HIGH_USE_SHARE)
    ? rng.between(18_000, 25_000)
    : rng.between(9_000, 14_000);
  const noise = rng.between(0.75, 1.3);
  const km = Math.round((age * perYear * noise) / 100) * 100;

  return clamp(km, 1_500, MAX_KM);
}

type PriceInput = {
  line: ModelLine;
  engine: Engine;
  trim: Trim;
  age: number;
  kmDriven: number;
  ownerCount: number;
};

function usedPrice(rng: Rng, input: PriceInput): number {
  const { line, engine, trim, age, kmDriven, ownerCount } = input;
  const [low, high] = engine.band;
  const newPrice = (low + (high - low) * trim.position) * 100_000;
  const retention = line.retention ?? (line.tier === "luxury" ? 0.89 : 0.92);
  const depreciation =
    age === 0 ? 0.9 : Math.max(0.25, 0.85 * retention ** (age - 1));
  const expectedKm = Math.max(age, 0.5) * 11_500;
  const kmFactor = 1 - 0.1 * clamp(kmDriven / expectedKm - 1, -0.5, 1.5);
  const ownerFactor = 1 - 0.05 * (ownerCount - 1);
  const noise = rng.between(0.96, 1.04);
  const price = newPrice * depreciation * kmFactor * ownerFactor * noise;
  const floor = (line.floor ?? 0) * 100_000 * rng.between(1, 1.08);

  return Math.round(Math.max(price, floor) / 1_000) * 1_000;
}

function safetyFor(line: ModelLine, year: number): number | null {
  if (line.safetyBefore && year < line.safetyBefore.year) {
    return line.safetyBefore.rating;
  }

  return line.safetyRating;
}

function variantName(
  engine: Engine,
  trim: string,
  gearbox: Gearbox | null,
): string {
  return [engine.label, trim, FUEL_WORD[engine.fuel], gearbox ?? ""]
    .filter(Boolean)
    .join(" ");
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

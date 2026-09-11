import { join } from "node:path";
import { BODY_TYPES, FUEL_TYPES } from "@repo/contracts";
import { formatInr } from "../src/format.ts";
import { generateCatalogue } from "../src/generator.ts";
import type { CatalogueVehicle } from "../src/types.ts";

const vehicles = generateCatalogue();
const target = join(import.meta.dir, "..", "data", "vehicles.json");

await Bun.write(target, `${JSON.stringify(vehicles, null, 2)}\n`);

const percent = (count: number): string =>
  `${((100 * count) / vehicles.length).toFixed(1)}%`;

const shares = <T extends string>(
  keys: readonly T[],
  of: (vehicle: CatalogueVehicle) => T,
): string =>
  keys
    .map((key) => `${key} ${percent(vehicles.filter((v) => of(v) === key).length)}`)
    .join(", ");

const prices = vehicles.map((v) => v.price).sort((a, b) => a - b);
const median = prices[Math.floor(prices.length / 2)] ?? 0;

console.log(`Wrote ${vehicles.length} vehicles to ${target}`);
console.log(`Body types: ${shares(BODY_TYPES, (v) => v.bodyType)}`);
console.log(`Fuel types: ${shares(FUEL_TYPES, (v) => v.fuelType)}`);
console.log(
  `Price: min ${formatInr(prices[0] ?? 0)}, median ${formatInr(median)}, max ${formatInr(prices.at(-1) ?? 0)}`,
);

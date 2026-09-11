import { loadCatalogue } from "@repo/catalogue";
import { db } from "../index.ts";

const CHUNK = 100;

const vehicles = loadCatalogue();
const ids = new Set(vehicles.map((vehicle) => vehicle.id));

const existing = new Map(
  (
    await db.vehicle.findMany({
      select: { id: true, description: true, price: true, kmDriven: true },
    })
  ).map((row) => [row.id, row]),
);

const fresh = vehicles.filter((vehicle) => !existing.has(vehicle.id));
const changed = vehicles.filter((vehicle) => {
  const row = existing.get(vehicle.id);
  return (
    row !== undefined &&
    (row.description !== vehicle.description ||
      row.price !== vehicle.price ||
      row.kmDriven !== vehicle.kmDriven)
  );
});
const orphaned = [...existing.keys()].filter((id) => !ids.has(id));

for (let start = 0; start < fresh.length; start += CHUNK) {
  await db.vehicle.createMany({
    data: fresh.slice(start, start + CHUNK),
    skipDuplicates: true,
  });
}

for (const vehicle of changed) {
  await db.vehicle.update({
    where: { id: vehicle.id },
    data: { ...vehicle, indexedAt: null, contentHash: null },
  });
}

if (orphaned.length > 0) {
  await db.vehicle.deleteMany({ where: { id: { in: orphaned } } });
}

const total = await db.vehicle.count();

console.log(
  JSON.stringify({
    inserted: fresh.length,
    updated: changed.length,
    deleted: orphaned.length,
    total,
  }),
);

await db.$disconnect();

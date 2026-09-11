import type { SearchFilters } from "@repo/contracts";
import { understand } from "../src/understanding/index.ts";
import golden from "../eval/golden.json";

type Golden = { query: string; filters: SearchFilters; sort: unknown };

const same = (a: unknown, b: unknown) =>
  JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

let exact = 0;
const fieldHits = new Map<string, { hit: number; total: number }>();

for (const entry of golden as Golden[]) {
  const { parsed, ms } = await understand(entry.query);
  const keys = new Set([
    ...Object.keys(entry.filters),
    ...Object.keys(parsed.filters),
  ]);
  let allSame = same(parsed.sort, entry.sort);

  for (const key of keys) {
    const bucket = fieldHits.get(key) ?? { hit: 0, total: 0 };
    bucket.total += 1;
    const hit = same(
      (parsed.filters as Record<string, unknown>)[key],
      (entry.filters as Record<string, unknown>)[key],
    );
    if (hit) bucket.hit += 1;
    else allSame = false;
    fieldHits.set(key, bucket);
  }

  if (allSame) exact += 1;
  console.log(
    `${allSame ? "ok  " : "diff"} ${ms}ms [${parsed.parser}] ${entry.query}\n     got ${JSON.stringify(parsed.filters)} sort=${JSON.stringify(parsed.sort)}\n     exp ${JSON.stringify(entry.filters)} sort=${JSON.stringify(entry.sort)}`,
  );
}

console.log(`\nexact match: ${exact}/${golden.length}`);
for (const [key, bucket] of [...fieldHits.entries()].sort()) {
  console.log(`  ${key}: ${bucket.hit}/${bucket.total}`);
}
process.exit(0);

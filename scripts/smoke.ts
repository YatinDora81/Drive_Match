const base = (
  process.argv[2] ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api/v1"
).replace(/\/+$/, "");

type Check = {
  query: string;
  expect: (data: Record<string, any>) => string | null;
};

const checks: Check[] = [
  {
    query: "Show SUVs under ₹15L",
    expect: (d) =>
      d.understood.filters.bodyTypes?.includes("SUV") &&
      d.understood.filters.priceMax === 1_500_000
        ? null
        : "expected bodyTypes SUV and priceMax 1500000",
  },
  {
    query: "Diesel automatic cars below 80k km",
    expect: (d) =>
      d.understood.filters.fuelTypes?.includes("DIESEL") &&
      d.understood.filters.transmissions?.includes("AUTOMATIC") &&
      d.understood.filters.kmMax === 80_000
        ? null
        : "expected DIESEL + AUTOMATIC + kmMax 80000",
  },
  {
    query: "Family cars with high safety ratings",
    expect: (d) =>
      (d.understood.filters.safetyRatingMin ?? 0) >= 4 &&
      d.results.every((r: any) => r.vehicle.safetyRating >= 4)
        ? null
        : "expected safetyRatingMin >= 4 and every result rated >= 4",
  },
  {
    query: "cheapest automatic hatchback in Bengaluru",
    expect: (d) => {
      const prices = d.results.map((r: any) => r.vehicle.price);
      const sorted = [...prices].sort((a, b) => a - b);
      return d.meta.rankedBy === "sort" &&
        JSON.stringify(prices) === JSON.stringify(sorted)
        ? null
        : "expected price ascending";
    },
  },
  {
    query: "7 seater under 12 lakh, not diesel",
    expect: (d) =>
      d.results.every(
        (r: any) =>
          r.vehicle.seats >= 7 &&
          r.vehicle.price <= 1_200_000 &&
          r.vehicle.fuelType !== "DIESEL",
      )
        ? null
        : "expected 7+ seats, <= 12L, no diesel",
  },
];

let failures = 0;

for (const check of checks) {
  const startedAt = Date.now();
  const res = await fetch(`${base}/search`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: check.query, limit: 12 }),
  });
  const json: any = await res.json();
  const ms = Date.now() - startedAt;

  if (!res.ok) {
    failures += 1;
    console.log(
      `FAIL ${res.status} ${check.query} -> ${json.error?.code}: ${json.error?.message}`,
    );
    continue;
  }

  const problem = check.expect(json.data);
  const m = json.data.meta;
  const verdict = problem ? "FAIL" : "ok  ";
  if (problem) failures += 1;

  console.log(
    `${verdict} ${ms}ms ${check.query} -> parser=${json.data.understood.parser} mode=${m.mode} rankedBy=${m.rankedBy} total=${m.total} returned=${m.returned} exact=${m.exact}${problem ? ` :: ${problem}` : ""}`,
  );
}

const offTopic = await fetch(`${base}/search`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ query: "what is the weather today" }),
});
const offTopicOk = offTopic.status === 422 || offTopic.status === 200;
console.log(
  `${offTopicOk ? "ok  " : "FAIL"} off-topic query -> ${offTopic.status} (422 with the model, 200 on the heuristic floor)`,
);
if (!offTopicOk) failures += 1;

console.log(failures === 0 ? "smoke: all good" : `smoke: ${failures} failing`);
process.exit(failures === 0 ? 0 : 1);

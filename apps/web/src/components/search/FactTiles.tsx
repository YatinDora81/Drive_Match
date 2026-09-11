import { formatCount, formatInr } from "../../lib/format";
import type { Tone } from "../../lib/tones";
import type { SearchResult } from "../../lib/types";
import { StatTile } from "../ui/StatTile";

type Props = { results: SearchResult[]; total: number | null };

type Fact = { tone: Tone; label: string; value: string };

function factsFor(results: SearchResult[]): Fact[] {
  const prices = results.map((result) => result.vehicle.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const average = Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);

  const ratings = results
    .map((result) => result.vehicle.safetyRating)
    .filter((rating): rating is number => rating !== null);

  const last: Fact =
    ratings.length > 0
      ? { tone: "sun", label: "Best safety", value: `${Math.max(...ratings)} of 5` }
      : {
          tone: "sun",
          label: "Newest",
          value: String(Math.max(...results.map((result) => result.vehicle.year))),
        };

  return [
    { tone: "grass", label: "Cheapest", value: formatInr(min) },
    { tone: "brand", label: "Average", value: formatInr(average) },
    { tone: "diesel", label: "Priciest", value: formatInr(max) },
    last,
  ];
}

export function FactTiles({ results, total }: Props) {
  if (results.length < 2) return null;
  const facts = factsFor(results);
  const partial = total !== null && total > results.length;

  return (
    <section aria-label="Quick facts about these results">
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {facts.map((fact) => (
          <li key={fact.label} className="min-w-0">
            <StatTile tone={fact.tone} label={fact.label} value={fact.value} />
          </li>
        ))}
      </ul>
      {partial ? (
        <p className="mt-2 text-[12.5px] text-ink-3 tabular-nums">
          Across the first {formatCount(results.length)} of {formatCount(total)}. Load more to
          widen these.
        </p>
      ) : null}
    </section>
  );
}

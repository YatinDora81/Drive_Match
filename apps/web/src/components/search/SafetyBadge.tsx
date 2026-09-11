import { SOFT, safetyTone } from "../../lib/tones";
import { Pill } from "../ui/Pill";

const PIPS = [1, 2, 3, 4, 5] as const;

export function SafetyBadge({ rating }: { rating: number | null }) {
  if (rating === null) {
    return <Pill className="shrink-0">Safety not rated</Pill>;
  }

  const stars = Math.min(5, Math.max(0, Math.round(rating)));
  const tone = safetyTone(stars);

  return (
    <span
      role="img"
      aria-label={`${stars} of 5 Global NCAP stars`}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-2.5 py-1 text-[11.5px] leading-none font-bold ${SOFT[tone]}`}
    >
      <span aria-hidden="true" className="flex items-center gap-[2px]">
        {PIPS.map((pip) => (
          <span
            key={pip}
            className={`h-[11px] w-[5px] rounded-[2px] bg-current ${
              pip <= stars ? "" : "opacity-25"
            }`}
          />
        ))}
      </span>
      <span aria-hidden="true" className="tabular-nums">
        {stars}/5 safety
      </span>
    </span>
  );
}

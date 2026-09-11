import { StarIcon } from "../icons";

type Props = {
  rating: number | null;
  short?: boolean;
};

export function NcapStars({ rating, short = false }: Props) {
  if (rating === null) {
    return (
      <span className="inline-flex items-center rounded-full border border-line bg-surface-2 px-2 py-[2px] text-[10.5px] font-medium text-body">
        Not rated
      </span>
    );
  }

  if (rating <= 0) {
    return (
      <span
        role="img"
        aria-label="0 of 5 Global NCAP stars"
        title="0 of 5 Global NCAP stars"
        className="inline-flex items-center rounded-full border border-red-line bg-red-bg px-2 py-[2px] text-[10.5px] font-medium text-red"
      >
        0★
      </span>
    );
  }

  const stars = Math.min(5, Math.round(rating));

  return (
    <span
      role="img"
      aria-label={`${stars} of 5 Global NCAP stars`}
      title={`${stars} of 5 Global NCAP stars`}
      className={`inline-flex items-center gap-[1px] ${short ? "text-orange" : "text-yellow"}`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <StarIcon
          key={index}
          filled={index < stars}
          className={`size-[11px] shrink-0 ${index < stars ? "" : "opacity-40"}`}
        />
      ))}
    </span>
  );
}

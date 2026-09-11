"use client";

import { ChipButton } from "../ui/Chip";

type Props = {
  recents: string[];
  onPick: (query: string) => void;
  onClear: () => void;
  align?: "center" | "start";
};

export function RecentSearches({
  recents,
  onPick,
  onClear,
  align = "start",
}: Props) {
  if (recents.length === 0) return null;
  const centered = align === "center";

  return (
    <section
      aria-labelledby="recents-title"
      className={`animate-fade ${centered ? "mx-auto max-w-[640px] text-center" : ""}`}
    >
      <div
        className={`mb-2.5 flex items-baseline gap-3 ${centered ? "justify-center" : ""}`}
      >
        <h2
          id="recents-title"
          className="font-mono text-[10px] uppercase tracking-[0.11em] text-ink-3"
        >
          Your recent searches
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex min-h-[24px] items-center rounded px-1.5 py-1 text-[11.5px] text-ink-3 underline decoration-rule-2 underline-offset-[3px] transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-bg"
        >
          Clear
        </button>
      </div>
      <ul className={`flex flex-wrap gap-2 ${centered ? "justify-center" : ""}`}>
        {recents.map((query) => (
          <li key={query}>
            <ChipButton onClick={() => onPick(query)} className="max-w-[420px]">
              <span className="truncate">{query}</span>
            </ChipButton>
          </li>
        ))}
      </ul>
    </section>
  );
}

"use client";

import { useReady } from "../../hooks/useReady";
import { ApiError } from "../../lib/api";
import { formatCount } from "../../lib/format";
import { DOT, type Tone } from "../../lib/tones";

export function ApiStatus() {
  const ready = useReady();

  let tone: Tone | null = null;
  let text = "Checking the search API…";
  if (ready.data) {
    tone = "grass";
    text = `Live · ${formatCount(ready.data.index.postgres)} cars indexed`;
  } else if (ready.error) {
    const degraded = ready.error instanceof ApiError && ready.error.status === 503;
    tone = degraded ? "sun" : "rose";
    text = degraded ? "Degraded · fallback search" : "Search API unreachable";
  }

  return (
    <p
      role="status"
      className="flex items-center gap-2 rounded-field bg-sunk px-3 py-2.5 text-[12.5px] font-semibold text-ink-2"
    >
      <span
        aria-hidden="true"
        className={`size-2 shrink-0 rounded-full ${tone ? DOT[tone] : "bg-ink-3"}`}
      />
      <span className="min-w-0 truncate tabular-nums">{text}</span>
    </p>
  );
}

"use client";

import { RefreshIcon, SparkIcon } from "../icons";
import { Button } from "../ui/Button";

export type SummaryState = "pending" | "done" | "failed";

type Props = {
  state: SummaryState;
  text: string | null;
  model: string;
  onRetry: () => void;
};

const BARS = ["w-full", "w-11/12", "w-3/5"] as const;

export function SummaryNote({ state, text, model, onRetry }: Props) {
  const pending = state === "pending";

  return (
    <section
      aria-label="AI summary"
      aria-busy={pending}
      aria-live="polite"
      className="animate-drop rounded-panel border border-l-4 border-line border-l-hybrid bg-card px-5 py-4 shadow-card"
    >
      <header className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="grid size-7 shrink-0 place-items-center rounded-[8px] bg-hybrid-soft text-hybrid"
        >
          <SparkIcon className="size-3.5" />
        </span>
        <h3 className="shrink-0 text-[15px] font-bold text-ink">AI summary</h3>
        <span className="ml-auto min-w-0 truncate text-[12.5px] text-ink-3">
          written by {model}
        </span>
      </header>

      <div className="mt-3">
        {pending ? (
          <div className="flex max-w-[72ch] flex-col gap-2.5">
            <span className="sr-only">Writing a summary…</span>
            {BARS.map((width) => (
              <span
                key={width}
                aria-hidden="true"
                className={`shimmer block h-3.5 rounded-full bg-sunk ${width}`}
              />
            ))}
          </div>
        ) : state === "failed" ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="text-[13.5px] text-ink-2">Couldn’t write a summary this time.</p>
            <Button variant="ghost" size="sm" onClick={onRetry}>
              <RefreshIcon />
              Try again
            </Button>
          </div>
        ) : text ? (
          <p className="max-w-[72ch] text-[15px] leading-relaxed text-ink-2">{text}</p>
        ) : (
          <p className="text-[13.5px] text-ink-3">
            The model didn’t return a summary for these results.
          </p>
        )}
      </div>
    </section>
  );
}

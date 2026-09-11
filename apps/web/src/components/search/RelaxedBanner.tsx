"use client";

import { relaxedFields } from "../../lib/chips";
import type { RelaxationStep, SearchFilters } from "../../lib/types";
import { WarningIcon } from "../icons";

type Props = {
  steps: RelaxationStep[];
  requested: SearchFilters;
  applied: SearchFilters;
  busy: boolean;
  onRestore: (filters: SearchFilters) => void;
};

function copyField<K extends keyof SearchFilters>(
  into: SearchFilters,
  from: SearchFilters,
  key: K,
): void {
  if (from[key] === undefined) delete into[key];
  else into[key] = from[key];
}

export function RelaxedBanner({ steps, requested, applied, busy, onRestore }: Props) {
  if (steps.length === 0) return null;
  const many = steps.length >= 2;

  const restoreOne = (step: RelaxationStep) => {
    const next: SearchFilters = { ...applied };
    for (const key of relaxedFields(step)) copyField(next, requested, key);
    onRestore(next);
  };

  return (
    <section
      aria-label="Loosened constraints"
      className="animate-drop rounded-tile border border-sun/30 bg-sun-soft p-4"
    >
      <h3 className="flex items-start gap-2 text-[15px] leading-snug font-bold text-sun">
        <WarningIcon className="mt-0.5 size-4 shrink-0" />
        <span className="min-w-0">
          {many
            ? "Nothing matched every constraint, so the search widened a few"
            : "Nothing matched exactly, so the search widened one constraint"}
        </span>
      </h3>
      <ul aria-label="Widened constraints" className="mt-2.5 flex flex-col gap-1.5">
        {steps.map((step, index) => (
          <li
            key={`${index}:${step.code}:${step.field}`}
            className="flex items-baseline gap-2 text-[13.5px] leading-relaxed text-ink-2 tabular-nums"
          >
            <i
              aria-hidden="true"
              className="block size-1.5 shrink-0 translate-y-[-2px] rounded-full bg-sun"
            />
            <span className="min-w-0">
              {step.message}{" "}
              <button
                type="button"
                disabled={busy}
                onClick={() => restoreOne(step)}
                className="relative rounded font-bold text-sun underline decoration-sun/40 underline-offset-[3px] transition-colors after:absolute after:-inset-x-1.5 after:-inset-y-2 after:content-[''] hover:decoration-sun disabled:cursor-default disabled:opacity-50"
              >
                Restore
              </button>
            </span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={busy}
        onClick={() => onRestore(requested)}
        className="mt-3 inline-flex h-9 items-center rounded-full border border-sun/30 bg-card px-4 text-[12.5px] font-bold text-sun transition-colors duration-150 hover:border-sun disabled:cursor-default disabled:opacity-50 disabled:hover:border-sun/30"
      >
        Show exact matches only
      </button>
    </section>
  );
}

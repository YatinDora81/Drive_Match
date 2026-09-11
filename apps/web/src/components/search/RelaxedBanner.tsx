"use client";

import { relaxedFields } from "../../lib/chips";
import type { RelaxationStep, SearchFilters } from "../../lib/types";
import { StaticChip } from "../ui/Chip";

type Props = {
  steps: RelaxationStep[];
  requested: SearchFilters;
  applied: SearchFilters;
  busy: boolean;
  onRestore: (filters: SearchFilters) => void;
};

const LINK =
  "inline-flex min-h-[24px] items-center rounded px-1.5 py-1 text-[11.5px] font-medium text-warn underline decoration-warn/40 underline-offset-[3px] transition-colors hover:decoration-warn focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-bg disabled:opacity-50";

function copyField<K extends keyof SearchFilters>(
  into: SearchFilters,
  from: SearchFilters,
  key: K,
): void {
  if (from[key] === undefined) delete into[key];
  else into[key] = from[key];
}

export function RelaxedBanner({
  steps,
  requested,
  applied,
  busy,
  onRestore,
}: Props) {
  if (steps.length === 0) return null;
  const loose = steps.length >= 2;

  const restoreOne = (step: RelaxationStep) => {
    const next: SearchFilters = { ...applied };
    for (const key of relaxedFields(step)) copyField(next, requested, key);
    onRestore(next);
  };

  return (
    <section
      aria-label="Loosened constraints"
      className="animate-drop rounded-[10px] border border-warn/25 bg-warn-bg/70 px-4 py-3"
    >
      <p className="text-[13px] font-medium leading-[1.5] text-warn">
        {loose
          ? "These are loose matches. Nothing met every constraint, so the search widened more than one:"
          : "No exact matches, so the search loosened one constraint:"}
      </p>
      <ul aria-label="Relaxed constraints" className="mt-2 flex flex-wrap gap-2">
        {steps.map((step, index) => (
          <li
            key={`${index}:${step.code}:${step.field}`}
            className="flex items-center gap-1.5"
          >
            <StaticChip variant="strike">{step.message}</StaticChip>
            <button
              type="button"
              disabled={busy}
              onClick={() => restoreOne(step)}
              className={LINK}
            >
              Restore
            </button>
          </li>
        ))}
      </ul>
      {loose ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => onRestore(requested)}
          className={`mt-2 ${LINK} font-normal`}
        >
          Restore all constraints
        </button>
      ) : null}
    </section>
  );
}

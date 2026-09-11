"use client";

import { useState } from "react";
import { useParse } from "../../hooks/useSearch";
import { chipsFromFilters, sortChipLabel } from "../../lib/chips";
import type { ParsedQuery, SearchFilters, SearchSort } from "../../lib/types";
import { RefreshIcon } from "../icons";
import { Button } from "../ui/Button";
import { RemovableChip, StaticChip } from "../ui/Chip";
import { Pill } from "../ui/Pill";

type Props = {
  query: string;
  requested: SearchFilters;
  understood: ParsedQuery;
  sort: SearchSort | null;
  semantic: { has: boolean; text: string };
  overrideMode: boolean;
  busy: boolean;
  debug: boolean;
  onRemoveChip: (remaining: SearchFilters) => void;
  onRemoveSort: () => void;
  onUndo: () => void;
  onRetryAi: () => void;
};

function ParseDisclosure({ query }: { query: string }) {
  const [open, setOpen] = useState(false);
  const parse = useParse(query, open);

  return (
    <details
      className="mt-2"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="cursor-pointer font-mono text-[10.5px] text-ink-3 hover:text-ink">
        Show parse
      </summary>
      <pre className="mt-2 max-h-[320px] overflow-auto rounded-[8px] border border-rule bg-paper-2 p-3 font-mono text-[10.5px] leading-[1.5] text-ink-2">
        {parse.isError
          ? parse.error.message
          : parse.data
            ? JSON.stringify(parse.data, null, 2)
            : "Parsing…"}
      </pre>
    </details>
  );
}

export function UnderstoodRow({
  query,
  requested,
  understood,
  sort,
  semantic,
  overrideMode,
  busy,
  debug,
  onRemoveChip,
  onRemoveSort,
  onUndo,
  onRetryAi,
}: Props) {
  const chips = chipsFromFilters(requested);
  const hasSemantic = semantic.has && semantic.text.trim().length > 0;
  const hasAny = chips.length > 0 || hasSemantic || sort !== null;

  return (
    <section aria-labelledby="understood-title" className="animate-drop">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <h2
          id="understood-title"
          className="font-mono text-[10px] uppercase tracking-[0.11em] text-ink-3"
        >
          Understood as
        </h2>
        {overrideMode ? (
          <span className="flex items-center gap-1.5">
            <Pill tone="accent">Edited</Pill>
            <button
              type="button"
              onClick={onUndo}
              disabled={busy}
              className="inline-flex min-h-[24px] items-center rounded px-1.5 py-1 text-[11.5px] text-ink-3 underline decoration-rule-2 underline-offset-[3px] transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-bg disabled:opacity-50"
            >
              Undo
            </button>
          </span>
        ) : null}
        {understood.parser === "heuristic" ? (
          <span className="flex flex-wrap items-center gap-1.5">
            <Pill tone="warn">
              Basic parsing — AI understanding was unavailable
            </Pill>
            <Button
              variant="ghost"
              onClick={onRetryAi}
              disabled={busy}
              className="!px-2 !py-1 !text-[11.5px]"
            >
              <RefreshIcon className="size-3" />
              Retry with AI
            </Button>
          </span>
        ) : null}
      </div>

      {hasAny ? (
        <ul aria-label="Understood filters" className="mt-2 flex flex-wrap gap-2">
          {hasSemantic ? (
            <li>
              <StaticChip variant="quoted">
                looking for: “{semantic.text.trim()}”
              </StaticChip>
            </li>
          ) : null}
          {chips.map((chip) => (
            <li key={chip.key}>
              <RemovableChip
                label={chip.label}
                disabled={busy}
                onRemove={() => onRemoveChip(chip.remove())}
              />
            </li>
          ))}
          {sort ? (
            <li>
              <RemovableChip
                label={sortChipLabel(sort)}
                disabled={busy}
                onRemove={onRemoveSort}
              />
            </li>
          ) : null}
        </ul>
      ) : (
        <p className="mt-2 text-[12.5px] text-ink-3">
          No filters — showing the whole catalogue
        </p>
      )}

      {understood.notes ? (
        <p className="mt-2 text-[12px] leading-[1.55] text-ink-3">
          {understood.notes}
        </p>
      ) : null}
      {understood.warnings.map((warning) => (
        <p key={warning} className="mt-1 text-[11.5px] leading-[1.5] text-warn">
          {warning}
        </p>
      ))}

      {debug ? <ParseDisclosure query={query} /> : null}
    </section>
  );
}

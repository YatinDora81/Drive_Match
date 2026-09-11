"use client";

import { useState } from "react";
import { useParse } from "../../hooks/useSearch";
import { chipsFromFilters, sortChipLabel, type FilterChip } from "../../lib/chips";
import { formatMs } from "../../lib/format";
import { FUEL_TONE, type Tone } from "../../lib/tones";
import type {
  ParsedQuery,
  SearchFilters,
  SearchMeta,
  SearchSort,
} from "../../lib/types";
import { RefreshIcon, SparkIcon, UndoIcon, WarningIcon } from "../icons";
import { Button } from "../ui/Button";
import { Pill } from "../ui/Pill";
import { Tag } from "../ui/Tag";

type Props = {
  query: string;
  requested: SearchFilters;
  understood: ParsedQuery;
  meta: SearchMeta;
  sort: SearchSort | null;
  semantic: { has: boolean; text: string };
  mode: "auto" | "edit" | "exact";
  busy: boolean;
  debug: boolean;
  onRemoveChip: (remaining: SearchFilters) => void;
  onRemoveSort: () => void;
  onUndo: () => void;
  onRetryAi: () => void;
};

type TagLook = { name: string; tone: Tone };

const LOOKS: Record<string, TagLook> = {
  makes: { name: "Brand", tone: "brand" },
  models: { name: "Model", tone: "brand" },
  bodyTypes: { name: "Type", tone: "hybrid" },
  transmissions: { name: "Gearbox", tone: "cng" },
  price: { name: "Budget", tone: "grass" },
  km: { name: "Driven", tone: "diesel" },
  year: { name: "Year", tone: "diesel" },
  seats: { name: "Seats", tone: "sun" },
  safety: { name: "Safety", tone: "sun" },
  owners: { name: "Owners", tone: "sun" },
  mileage: { name: "Mileage", tone: "sun" },
  range: { name: "Range", tone: "electric" },
  cities: { name: "City", tone: "petrol" },
};

function lookFor(key: string, filters: SearchFilters): TagLook {
  if (key === "fuelTypes") {
    const only = filters.fuelTypes?.length === 1 ? filters.fuelTypes[0] : undefined;
    return { name: "Fuel", tone: only ? FUEL_TONE[only] : "brand" };
  }
  if (key.startsWith("feature:")) return { name: "Nice to have", tone: "electric" };
  if (key.startsWith("color:")) return { name: "Colour", tone: "petrol" };
  if (key.startsWith("exclude")) return { name: "Not", tone: "rose" };
  return LOOKS[key] ?? { name: "Filter", tone: "brand" };
}

function valueFor(chip: FilterChip): string {
  let value = chip.label.replace(/^(in |not |prefers: )/, "");
  if (chip.key === "seats") value = value.replace(/ seats$/, "");
  if (chip.key === "range") value = value.replace(/ range or more$/, " or more");
  return value;
}

function whoParsed(understood: ParsedQuery, meta: SearchMeta, mode: Props["mode"]): string {
  switch (understood.parser) {
    case "llm":
      return `${meta.model.generation} · ${formatMs(meta.timings.parseMs)}`;
    case "heuristic":
      return `keyword parser · ${formatMs(meta.timings.parseMs)}`;
    case "override":
      return mode === "exact" ? "exact filters" : "your edits";
  }
}

function ParseDisclosure({ query }: { query: string }) {
  const [open, setOpen] = useState(false);
  const parse = useParse(query, open);

  return (
    <details
      className="mt-3"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="inline-flex min-h-9 cursor-pointer items-center text-[12.5px] font-semibold text-ink-3 transition-colors hover:text-ink">
        Show parse
      </summary>
      <pre className="scroll-thin mt-2 max-h-[320px] overflow-auto rounded-field border border-line bg-sunk p-3 font-mono text-[11px] leading-[1.55] text-ink-2">
        {parse.isError
          ? parse.error.message
          : parse.data
            ? JSON.stringify(parse.data, null, 2)
            : "Parsing…"}
      </pre>
    </details>
  );
}

export function UnderstoodPanel({
  query,
  requested,
  understood,
  meta,
  sort,
  semantic,
  mode,
  busy,
  debug,
  onRemoveChip,
  onRemoveSort,
  onUndo,
  onRetryAi,
}: Props) {
  const chips = chipsFromFilters(requested);
  const semanticText = semantic.text.trim();
  const hasSemantic = semantic.has && semanticText.length > 0;
  const hasAny = chips.length > 0 || hasSemantic || sort !== null;
  const offset = hasSemantic ? 1 : 0;

  return (
    <section
      aria-labelledby="understood-title"
      className="animate-drop rounded-panel border border-l-4 border-line border-l-brand bg-card px-5 py-4 shadow-card"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <span
          aria-hidden="true"
          className="grid size-7 shrink-0 place-items-center rounded-[8px] bg-brand-soft text-brand"
        >
          <SparkIcon className="size-3.5" />
        </span>
        <h2 id="understood-title" className="text-[15px] font-bold text-ink">
          Here’s what I understood
        </h2>

        {mode === "edit" ? (
          <span className="flex items-center gap-1">
            <Pill tone="brand">Edited</Pill>
            <Button variant="ghost" size="sm" onClick={onUndo} disabled={busy}>
              <UndoIcon />
              Undo
            </Button>
          </span>
        ) : null}
        {mode === "exact" ? <Pill tone="grass">Exact matches only</Pill> : null}
        {understood.parser === "heuristic" ? (
          <span className="flex flex-wrap items-center gap-1">
            <Pill tone="sun">AI unavailable · keyword parsing</Pill>
            <Button variant="ghost" size="sm" onClick={onRetryAi} disabled={busy}>
              <RefreshIcon />
              Retry with AI
            </Button>
          </span>
        ) : null}

        <span className="ml-auto min-w-0 truncate text-[12.5px] text-ink-3 tabular-nums">
          {whoParsed(understood, meta, mode)}
        </span>
      </div>

      {hasAny ? (
        <ul aria-label="Understood filters" className="mt-3.5 flex flex-wrap gap-2">
          {hasSemantic ? (
            <li className="max-w-full">
              <Tag tone="hybrid" name="Looking for">
                “{semanticText}”
              </Tag>
            </li>
          ) : null}
          {chips.map((chip, index) => {
            const { name, tone } = lookFor(chip.key, requested);
            const value = valueFor(chip);
            return (
              <li key={chip.key} className="max-w-full">
                <Tag
                  tone={tone}
                  name={name}
                  onRemove={() => onRemoveChip(chip.remove())}
                  removeLabel={`Remove ${name}: ${value}`}
                  disabled={busy}
                  style={{ animationDelay: `${(index + offset) * 30}ms` }}
                >
                  {value}
                </Tag>
              </li>
            );
          })}
          {sort ? (
            <li className="max-w-full">
              <Tag
                tone="neutral"
                name="Sorted"
                onRemove={onRemoveSort}
                removeLabel={`Remove sort: ${sortChipLabel(sort)}`}
                disabled={busy}
                style={{ animationDelay: `${(chips.length + offset) * 30}ms` }}
              >
                {sortChipLabel(sort)}
              </Tag>
            </li>
          ) : null}
        </ul>
      ) : (
        <p className="mt-3 text-[13.5px] text-ink-3">
          No filters, so this shows the whole catalogue.
        </p>
      )}

      {understood.notes ? (
        <p className="mt-3 text-[13.5px] leading-relaxed text-ink-3">{understood.notes}</p>
      ) : null}
      {understood.warnings.length > 0 ? (
        <div className="mt-2 flex flex-col gap-1">
          {understood.warnings.map((warning) => (
            <p
              key={warning}
              className="flex items-start gap-1.5 text-[12.5px] leading-normal text-sun"
            >
              <WarningIcon className="mt-[3px] size-3.5 shrink-0" />
              <span className="min-w-0">{warning}</span>
            </p>
          ))}
        </div>
      ) : null}

      {debug ? <ParseDisclosure query={query} /> : null}
    </section>
  );
}

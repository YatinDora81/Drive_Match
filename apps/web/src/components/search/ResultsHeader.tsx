"use client";

import { formatCount, formatMs, plural, sortLabel } from "../../lib/format";
import type { SearchResponse } from "../../lib/types";
import { Pill } from "../ui/Pill";
import { Toggle } from "../ui/Toggle";

type Props = {
  page: SearchResponse;
  shown: number;
  debug: boolean;
  onToggleDebug: () => void;
  wantSummary: boolean;
  onToggleSummary: () => void;
  exactOnly: boolean;
  onToggleExact: () => void;
};

function Headline({ page, shown }: { page: SearchResponse; shown: number }) {
  const { meta } = page;
  const total = meta.total;

  if (meta.relaxed.length > 0) {
    const close = total ?? shown;
    return (
      <>
        {formatCount(close)} close {plural(close, "match", "matches")}
        <span className="font-semibold text-ink-3"> · nothing matched exactly</span>
      </>
    );
  }
  if (meta.exact && total !== null) {
    return (
      <>
        {formatCount(total)} {plural(total, "car")} found
      </>
    );
  }
  return (
    <>
      Top {formatCount(shown)} {plural(shown, "match", "matches")}
      <span className="font-semibold text-ink-3"> · ranked by similarity</span>
    </>
  );
}

function rankLabel(page: SearchResponse): string {
  switch (page.meta.rankedBy) {
    case "default":
      return "Newest first";
    case "sort":
      return page.understood.sort ? sortLabel(page.understood.sort) : "Sorted";
    case "similarity":
      return "Best match first";
  }
}

export function ResultsHeader({
  page,
  shown,
  debug,
  onToggleDebug,
  wantSummary,
  onToggleSummary,
  exactOnly,
  onToggleExact,
}: Props) {
  const { meta } = page;

  return (
    <div className="animate-fade">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h2 className="text-[22px] leading-tight font-extrabold tracking-[-0.03em] text-balance text-ink tabular-nums">
            <Headline page={page} shown={shown} />
          </h2>
          <ul aria-label="How these results were found" className="mt-2.5 flex flex-wrap gap-1.5">
            <li>
              <Pill>{rankLabel(page)}</Pill>
            </li>
            <li>
              <Pill>{meta.mode === "vector" ? "Semantic + filters" : "Filters only"}</Pill>
            </li>
            <li>
              <Pill className="tabular-nums">
                <span>
                  <b className="text-ink">{formatMs(meta.timings.totalMs)}</b> total
                </span>
              </Pill>
            </li>
            {meta.degraded ? (
              <li>
                <Pill tone="sun">Fallback path</Pill>
              </li>
            ) : null}
          </ul>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Toggle compact pressed={wantSummary} onClick={onToggleSummary}>
            AI summary
          </Toggle>
          <Toggle
            compact
            pressed={exactOnly}
            onClick={onToggleExact}
            title="Never widen the search"
          >
            Exact only
          </Toggle>
          <button
            type="button"
            aria-pressed={debug}
            onClick={onToggleDebug}
            className={`h-9 rounded-full px-3 font-mono text-[11px] transition-colors duration-150 ${
              debug ? "bg-brand-soft text-brand" : "text-ink-3 hover:bg-sunk hover:text-ink"
            }`}
          >
            debug
          </button>
        </div>
      </div>

      {debug ? (
        <p className="mt-3 font-mono text-[10.5px] leading-[1.6] break-words text-ink-3">
          mode {meta.mode} · ranked {meta.rankedBy} · parser {page.understood.parser} · cache
          understanding:{String(meta.cache.understanding)} embedding:
          {String(meta.cache.embedding)} · {meta.model.generation} / {meta.model.embedding} ·
          parse {formatMs(meta.timings.parseMs)} embed {formatMs(meta.timings.embedMs)} search{" "}
          {formatMs(meta.timings.searchMs)} hydrate {formatMs(meta.timings.hydrateMs)} explain{" "}
          {formatMs(meta.timings.explainMs)} total {formatMs(meta.timings.totalMs)} · catalogue{" "}
          {formatCount(meta.catalogueSize)} · request {meta.requestId ?? "—"}
        </p>
      ) : null}
    </div>
  );
}

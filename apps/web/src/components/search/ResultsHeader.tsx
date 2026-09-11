"use client";

import { formatCount, formatMs, plural, sortLabel } from "../../lib/format";
import type { SearchResponse } from "../../lib/types";
import { SparkIcon } from "../icons";
import { Button } from "../ui/Button";
import { Pill } from "../ui/Pill";

type Props = {
  page: SearchResponse;
  shown: number;
  debug: boolean;
  onToggleDebug: () => void;
  onSummarize: () => void;
  summarizing: boolean;
  summary: string | null;
};

export function counterParts(
  page: SearchResponse,
  shown: number,
): { head: string; tail: string } {
  const { meta, understood } = page;
  const total = meta.total;
  let head: string;

  if (meta.relaxed.length > 0) {
    const close = total ?? shown;
    head = `0 exact matches · ${formatCount(close)} close ${plural(close, "match", "matches")}`;
  } else if (meta.exact && total !== null) {
    head = `${formatCount(total)} ${plural(total, "match", "matches")}`;
  } else {
    head = `Top ${formatCount(shown)} ${plural(shown, "match", "matches")}`;
  }

  const tail =
    meta.rankedBy === "default"
      ? "sorted by newest"
      : meta.rankedBy === "sort"
        ? understood.sort
          ? sortLabel(understood.sort).toLowerCase()
          : "sorted"
        : "ranked by similarity";

  return { head, tail };
}

export function ResultsHeader({
  page,
  shown,
  debug,
  onToggleDebug,
  onSummarize,
  summarizing,
  summary,
}: Props) {
  const { head, tail } = counterParts(page, shown);
  const { meta } = page;

  return (
    <div className="animate-fade">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-rule pb-3">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h2 className="font-display text-[19px] font-semibold leading-none tracking-[-0.025em] text-ink">
            {head}
          </h2>
          <span className="text-[12.5px] text-ink-3">· {tail}</span>
          {meta.degraded ? (
            <Pill tone="warn" className="self-center">
              degraded
            </Pill>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            onClick={onSummarize}
            disabled={summarizing || summary !== null}
            className="!px-2.5"
          >
            <SparkIcon />
            {summarizing ? "Summarizing…" : "Summarize these results"}
          </Button>
          <button
            type="button"
            aria-pressed={debug}
            onClick={onToggleDebug}
            className={`rounded px-2 py-1 font-mono text-[10.5px] transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-bg ${
              debug ? "bg-paper-3 text-ink" : "text-ink-3 hover:text-ink"
            }`}
          >
            debug
          </button>
        </div>
      </div>

      {summary ? (
        <div className="animate-drop mt-3">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.11em] text-ink-3">
            AI summary
          </span>
          <p className="mt-1 max-w-[760px] text-[15px] italic leading-[1.6] tracking-[-0.008em] text-ink-2">
            {summary}
          </p>
        </div>
      ) : null}

      {debug ? (
        <p className="mt-2 font-mono text-[10px] leading-[1.6] text-ink-3">
          mode {meta.mode} · ranked {meta.rankedBy} · parser{" "}
          {page.understood.parser} · cache understanding:
          {String(meta.cache.understanding)} embedding:
          {String(meta.cache.embedding)} · {meta.model.generation} /{" "}
          {meta.model.embedding} · parse {formatMs(meta.timings.parseMs)} embed{" "}
          {formatMs(meta.timings.embedMs)} search {formatMs(meta.timings.searchMs)}{" "}
          hydrate {formatMs(meta.timings.hydrateMs)} total{" "}
          {formatMs(meta.timings.totalMs)} · catalogue{" "}
          {formatCount(meta.catalogueSize)} · request {meta.requestId ?? "—"}
        </p>
      ) : null}
    </div>
  );
}

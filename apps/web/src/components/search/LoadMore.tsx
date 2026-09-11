"use client";

import { ApiError } from "../../lib/api";
import { formatCount, plural } from "../../lib/format";
import { ArrowUpIcon } from "../icons";
import { Button } from "../ui/Button";
import { Pill } from "../ui/Pill";

type Props = {
  hasMore: boolean;
  capped: boolean;
  limit: number;
  shown: number;
  total: number | null;
  pageCount: number;
  loading: boolean;
  error: unknown;
  onLoadMore: () => void;
  onBackToTop: () => void;
};

export function ContinuationError({ error }: { error: unknown }) {
  const apiError = error instanceof ApiError ? error : null;
  let text: string;
  if (apiError?.code === "RATE_LIMITED") {
    text =
      apiError.retryAfter !== null
        ? `Too many searches in a short window. You can load more in ${apiError.retryAfter} ${plural(apiError.retryAfter, "second")}.`
        : "Too many searches in a short window. Wait a moment, then try again.";
  } else {
    const cause = error instanceof Error ? error.message : "Trying again is safe.";
    text = `Couldn't load more results. ${cause}`;
  }

  return (
    <div role="alert" className="flex max-w-[440px] flex-col items-center gap-2 text-center">
      {apiError ? (
        <Pill tone="rose" mono>
          {apiError.code}
          {apiError.status ? ` · ${apiError.status}` : ""}
        </Pill>
      ) : null}
      <p className="text-[13.5px] leading-relaxed text-ink-2">{text}</p>
      {apiError?.requestId ? (
        <p className="font-mono text-[11px] break-all text-ink-3">request {apiError.requestId}</p>
      ) : null}
    </div>
  );
}

export function LoadMore({
  hasMore,
  capped,
  limit,
  shown,
  total,
  pageCount,
  loading,
  error,
  onLoadMore,
  onBackToTop,
}: Props) {
  const all = total ?? shown;
  const remaining = total !== null ? total - shown : 0;
  const next = remaining > 0 ? Math.min(limit, remaining) : limit;

  return (
    <div className="mt-4 flex flex-col items-center gap-3 text-center">
      <p className="text-[12.5px] font-semibold text-ink-3 tabular-nums">
        {total !== null
          ? `Showing ${formatCount(shown)} of ${formatCount(total)}`
          : `Showing ${formatCount(shown)}`}
      </p>

      {error ? <ContinuationError error={error} /> : null}

      {hasMore ? (
        <Button
          variant="outline"
          size="lg"
          onClick={onLoadMore}
          disabled={loading}
          aria-busy={loading}
          className="tabular-nums"
        >
          {loading
            ? "Loading…"
            : error
              ? "Try again"
              : `Show ${formatCount(next)} more ${plural(next, "car")}`}
        </Button>
      ) : capped ? (
        <p className="max-w-[440px] text-[13.5px] leading-relaxed text-ink-2 tabular-nums">
          {total !== null
            ? `Showing the top ${formatCount(shown)} of ${formatCount(total)} ${plural(total, "match", "matches")}. Similarity ranking stops at ${formatCount(shown)}.`
            : `Showing the top ${formatCount(shown)} ${plural(shown, "match", "matches")}. Similarity ranking stops here.`}
        </p>
      ) : (
        <p className="text-[13.5px] text-ink-2 tabular-nums">
          That’s all {formatCount(all)} {plural(all, "match", "matches")}.
        </p>
      )}

      {pageCount >= 2 ? (
        <Button variant="ghost" size="sm" onClick={onBackToTop}>
          <ArrowUpIcon />
          Back to top
        </Button>
      ) : null}
    </div>
  );
}

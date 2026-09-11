"use client";

import { ApiError } from "../../lib/api";
import { formatCount, plural } from "../../lib/format";
import { Button } from "../ui/Button";

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

function ContinuationError({ error }: { error: unknown }) {
  const apiError = error instanceof ApiError ? error : null;
  let text: string;
  if (apiError?.code === "RATE_LIMITED") {
    text =
      apiError.retryAfter !== null
        ? `Too many searches in a short window. You can load more in ${apiError.retryAfter} ${plural(apiError.retryAfter, "second")}.`
        : "Too many searches in a short window. Wait a moment, then try again.";
  } else {
    const cause = error instanceof Error ? error.message : "Trying again is safe.";
    text = `Could not load more results. ${cause}`;
  }

  return (
    <div className="flex max-w-[440px] flex-col items-center gap-1.5 text-center">
      {apiError ? (
        <span className="rounded-full border border-red-line bg-red-bg px-2.5 py-1 font-mono text-[10.5px] text-red">
          {apiError.code}
          {apiError.status ? ` · ${apiError.status}` : ""}
        </span>
      ) : null}
      <p className="text-[13px] leading-[1.6] text-body">{text}</p>
      {apiError?.requestId ? (
        <p className="font-mono text-[10.5px] text-muted">
          request {apiError.requestId}
        </p>
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

  return (
    <div className="mt-8 flex flex-col items-center gap-3 border-t border-line pt-6">
      <span className="font-mono text-[10.5px] text-muted">
        {total !== null
          ? `Showing ${formatCount(shown)} of ${formatCount(total)}`
          : `Showing ${formatCount(shown)}`}
      </span>
      {error ? <ContinuationError error={error} /> : null}
      {hasMore ? (
        <Button variant="outline" onClick={onLoadMore} disabled={loading}>
          {loading ? "Loading…" : error ? "Try again" : `Load ${limit} more`}
        </Button>
      ) : capped ? (
        <p className="max-w-[440px] text-center text-[13px] leading-[1.6] text-body">
          {total !== null
            ? `Showing the top ${formatCount(shown)} of ${formatCount(total)} ${plural(total, "match", "matches")} — similarity ranking stops at ${formatCount(shown)}.`
            : `Showing the top ${formatCount(shown)} ${plural(shown, "match", "matches")} — similarity ranking stops here.`}
        </p>
      ) : (
        <p className="text-[13px] text-body">
          That’s all {formatCount(all)} {plural(all, "match", "matches")}
        </p>
      )}
      {pageCount >= 2 ? (
        <Button variant="ghost" onClick={onBackToTop}>
          Back to top
        </Button>
      ) : null}
    </div>
  );
}

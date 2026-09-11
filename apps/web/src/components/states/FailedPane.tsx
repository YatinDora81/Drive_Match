"use client";

import { ApiError } from "../../lib/api";
import { WarningIcon } from "../icons";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";

type Props = {
  error: unknown;
  onRetry: () => void;
  busy?: boolean;
};

const CAUSE: Record<string, string> = {
  VALIDATION_ERROR:
    "The request was rejected before searching. Queries need between 2 and 500 characters.",
  NOT_FOUND: "That record is no longer in the catalogue.",
  RATE_LIMITED:
    "Too many searches in a short window. Each search is a model call, so they are metered.",
  UPSTREAM_ERROR: "The language model returned an error. Trying again usually clears it.",
  EMBEDDING_FAILED:
    "The query could not be embedded for similarity search. Trying again usually clears it.",
  SERVICE_UNAVAILABLE: "The search service is not ready yet. Give it a moment and try again.",
  SEARCH_UNAVAILABLE:
    "The vector index is unreachable, and the fallback could not serve this query either.",
  CATALOGUE_UNAVAILABLE:
    "The catalogue database is unreachable. Nothing can be searched until it is back.",
  UPSTREAM_TIMEOUT: "The model took too long to answer. Trying again often works.",
  INTERNAL: "Something broke on the server. The request id below identifies it in the logs.",
  NETWORK_ERROR:
    "The browser could not reach the API. Check that it is running and that NEXT_PUBLIC_API_URL points at it.",
};

const FALLBACK = "Something went wrong while searching. Trying again is safe.";

function causeOf(apiError: ApiError | null, code: string): string {
  if (code === "RATE_LIMITED") {
    const wait = apiError?.retryAfter;
    if (wait !== null && wait !== undefined) {
      return `You can search again in ${wait} ${wait === 1 ? "second" : "seconds"}.`;
    }
    return CAUSE.RATE_LIMITED ?? FALLBACK;
  }
  return CAUSE[code] ?? FALLBACK;
}

export function FailedPane({ error, onRetry, busy = false }: Props) {
  const apiError = error instanceof ApiError ? error : null;
  const code = apiError?.code ?? "UNKNOWN";
  const message =
    (error instanceof Error && error.message ? error.message : null) ??
    "That search could not be completed";
  const rateLimited = code === "RATE_LIMITED";

  return (
    <div role="alert">
      <EmptyState
        tone="rose"
        icon={<WarningIcon />}
        eyebrow={
          <span className="inline-block rounded-full bg-rose-soft px-2.5 py-1 font-mono text-[11px] text-rose">
            {code}
            {apiError?.status ? ` · ${apiError.status}` : ""}
          </span>
        }
        title={rateLimited ? "Slow down a moment" : message}
        actions={
          <Button variant="primary" onClick={onRetry} disabled={busy}>
            Try again
          </Button>
        }
      >
        <p>{causeOf(apiError, code)}</p>
        {apiError?.requestId ? (
          <p className="mt-3 font-mono text-[11px] break-all text-ink-3">
            request {apiError.requestId}
          </p>
        ) : null}
      </EmptyState>
    </div>
  );
}

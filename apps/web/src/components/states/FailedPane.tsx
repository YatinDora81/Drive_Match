"use client";

import { ApiError } from "../../lib/api";
import { Button } from "../ui/Button";

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
  UPSTREAM_ERROR:
    "The language model returned an error. Trying again usually clears it.",
  EMBEDDING_FAILED:
    "The query could not be embedded for similarity search. Trying again usually clears it.",
  SERVICE_UNAVAILABLE:
    "The search service is not ready yet. Give it a moment and try again.",
  SEARCH_UNAVAILABLE:
    "The vector index is unreachable, and the fallback could not serve this query either.",
  CATALOGUE_UNAVAILABLE:
    "The catalogue database is unreachable. Nothing can be searched until it is back.",
  UPSTREAM_TIMEOUT: "The model took too long to answer. Trying again often works.",
  INTERNAL:
    "Something broke on the server. The request id below identifies it in the logs.",
  NETWORK_ERROR:
    "The browser could not reach the API. Check that it is running and that NEXT_PUBLIC_API_URL points at it.",
};

const FALLBACK = "Something went wrong while searching. Trying again is safe.";

export function FailedPane({ error, onRetry, busy = false }: Props) {
  const apiError = error instanceof ApiError ? error : null;
  const code = apiError?.code ?? "UNKNOWN";
  const message =
    (error instanceof Error ? error.message : null) ??
    "That search could not be completed";
  const rateLimited = apiError?.code === "RATE_LIMITED";

  return (
    <div className="animate-rise grid place-items-center px-5 py-14">
      <div className="max-w-[440px] text-center">
        <span className="mb-3.5 inline-block rounded-full border border-red-line bg-red-bg px-2.5 py-1 font-mono text-[10.5px] text-red">
          {code}
          {apiError?.status ? ` · ${apiError.status}` : ""}
        </span>
        <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-ink">
          {rateLimited ? "Slow down a moment" : message}
        </h3>
        <p className="mt-2.5 text-[13.5px] leading-[1.66] text-body">
          {rateLimited
            ? apiError?.retryAfter !== null && apiError?.retryAfter !== undefined
              ? `You can search again in ${apiError.retryAfter} ${
                  apiError.retryAfter === 1 ? "second" : "seconds"
                }.`
              : CAUSE.RATE_LIMITED
            : (CAUSE[code] ?? FALLBACK)}
        </p>
        {apiError?.requestId ? (
          <p className="mt-3 font-mono text-[10.5px] text-muted">
            request {apiError.requestId}
          </p>
        ) : null}
        <Button
          variant="primary"
          className="mt-[19px]"
          onClick={onRetry}
          disabled={busy}
        >
          Try again
        </Button>
      </div>
    </div>
  );
}

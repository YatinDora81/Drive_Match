import { AppError } from "@repo/contracts";

export type UpstreamFailure = {
  status: number | null;
  reason: string | null;
  message: string;
};

export function inspectFailure(error: unknown): UpstreamFailure {
  const status =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
      ? (error as { status: number }).status
      : null;

  const message = error instanceof Error ? error.message : String(error);

  return {
    status: status ?? readStatus(message),
    reason: readReason(message),
    message,
  };
}

function readJsonError(message: string): Record<string, unknown> | null {
  if (!message.trimStart().startsWith("{")) return null;

  try {
    const parsed: unknown = JSON.parse(message);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "error" in parsed &&
      typeof (parsed as { error: unknown }).error === "object" &&
      (parsed as { error: unknown }).error !== null
    ) {
      return (parsed as { error: Record<string, unknown> }).error;
    }
  } catch {
    return null;
  }

  return null;
}

function readReason(message: string): string | null {
  const inner = readJsonError(message);
  return inner && typeof inner.status === "string" ? inner.status : null;
}

function readStatus(message: string): number | null {
  const inner = readJsonError(message);
  return inner && typeof inner.code === "number" ? inner.code : null;
}

export function isRetryable(failure: UpstreamFailure): boolean {
  if (failure.status === null) return true;
  if (failure.status === 408 || failure.status === 429) return true;
  return failure.status >= 500 && failure.status < 600;
}

export function isKeyFault(failure: UpstreamFailure): boolean {
  if (failure.status === 401 || failure.status === 403) return true;
  return failure.status === 400 && /api[ _]?key/i.test(failure.message);
}

export function isQuotaExhausted(failure: UpstreamFailure): boolean {
  return failure.status === 429 && failure.reason === "RESOURCE_EXHAUSTED";
}

export function toAppError(failure: UpstreamFailure, action: string): AppError {
  if (isKeyFault(failure)) {
    return new AppError(
      "SERVICE_UNAVAILABLE",
      `No usable Gemini api key is left while ${action}.`,
    );
  }

  if (failure.status === 429) {
    return new AppError(
      "RATE_LIMITED",
      `Gemini rate limit reached while ${action}. Try again shortly.`,
    );
  }

  if (failure.status === 408 || failure.status === 504) {
    return new AppError("UPSTREAM_TIMEOUT", `Gemini timed out while ${action}.`);
  }

  if (failure.status === null || failure.status >= 500) {
    return new AppError("UPSTREAM_ERROR", `Gemini is unavailable while ${action}.`);
  }

  return new AppError("INTERNAL", `Gemini rejected the request while ${action}.`);
}

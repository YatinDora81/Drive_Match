import type {
  Facets,
  ListVehiclesParams,
  ParsedQuery,
  ReadyResponse,
  SearchRequest,
  SearchResponse,
  Vehicle,
  VehicleList,
} from "./types";

function resolveBase(raw: string | undefined): string {
  const value = (raw ?? "http://localhost:4000/api/v1").replace(/\/+$/, "");
  return /\/api\/v\d+$/.test(value) ? value : `${value}/api/v1`;
}

const BASE = resolveBase(process.env.NEXT_PUBLIC_API_URL);

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details: unknown = null,
    public requestId: string | null = null,
    public retryAfter: number | null = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const RETRYABLE = new Set([
  "UPSTREAM_ERROR",
  "EMBEDDING_FAILED",
  "SERVICE_UNAVAILABLE",
  "SEARCH_UNAVAILABLE",
  "CATALOGUE_UNAVAILABLE",
  "UPSTREAM_TIMEOUT",
  "NETWORK_ERROR",
]);

export function isRetryable(error: unknown): boolean {
  return error instanceof ApiError && RETRYABLE.has(error.code);
}

export const isAbort = (error: unknown): boolean =>
  error instanceof DOMException && error.name === "AbortError";

function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, Math.round(seconds));
  const at = Date.parse(value);
  return Number.isNaN(at)
    ? null
    : Math.max(0, Math.round((at - Date.now()) / 1000));
}

function retrySecondsIn(details: unknown): number | null {
  if (!details || typeof details !== "object") return null;
  const record = details as Record<string, unknown>;
  const raw = record.retryAfterSeconds ?? record.retryAfter;
  if (raw === undefined || raw === null) return null;
  const seconds = Number(raw);
  return Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : null;
}

type Envelope<T> = { data: T };

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch (error) {
    if (isAbort(error)) throw error;
    throw new ApiError("NETWORK_ERROR", "Could not reach the search service.", 0);
  }

  const json: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const error =
      json && typeof json === "object" && "error" in json
        ? (
            json as {
              error: Partial<{
                code: string;
                message: string;
                details: unknown;
                requestId: string;
              }>;
            }
          ).error
        : null;
    const details = error?.details;

    throw new ApiError(
      error?.code ?? `HTTP_${res.status}`,
      error?.message ?? "Request failed",
      res.status,
      details ?? null,
      error?.requestId ?? null,
      parseRetryAfter(res.headers.get("retry-after")) ?? retrySecondsIn(details),
    );
  }

  return json as T;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const body = await call<Envelope<T>>(path, init);
  return body.data;
}

function queryString(params: ListVehiclesParams): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    search.set(key, Array.isArray(value) ? value.join(",") : String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

export const api = {
  search: (body: SearchRequest, signal?: AbortSignal) =>
    request<SearchResponse>("/search", {
      method: "POST",
      body: JSON.stringify(body),
      signal,
    }),

  parse: (query: string, signal?: AbortSignal) =>
    request<ParsedQuery>("/search/parse", {
      method: "POST",
      body: JSON.stringify({ query }),
      signal,
    }),

  vehicles: (params: ListVehiclesParams = {}, signal?: AbortSignal) =>
    call<VehicleList>(`/vehicles${queryString(params)}`, { signal }),

  facets: (signal?: AbortSignal) => request<Facets>("/vehicles/facets", { signal }),

  vehicle: (id: string, signal?: AbortSignal) =>
    request<Vehicle>(`/vehicles/${encodeURIComponent(id)}`, { signal }),

  ready: (signal?: AbortSignal) =>
    request<ReadyResponse>("/health/ready", { signal }),
};

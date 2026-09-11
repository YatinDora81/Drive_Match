import type {
  SearchFilters,
  SearchRequest,
  SearchResponse,
  SearchSort,
} from "./types";

export type SearchOverride = {
  filters: SearchFilters;
  semanticQuery: string;
  hasSemanticIntent: boolean;
  sort: SearchSort | null;
  source?: "edit" | "exact";
};

export type SearchParams = {
  query: string;
  override: SearchOverride | null;
};

export type PageParam = {
  offset: number;
  continuation: SearchOverride | null;
};

export const FIRST_PAGE: PageParam = { offset: 0, continuation: null };

function overrideFields(override: SearchOverride): Omit<SearchRequest, "query"> {
  const semanticQuery = override.semanticQuery.trim();
  return {
    filters: override.filters,
    ...(semanticQuery ? { semanticQuery } : {}),
    hasSemanticIntent: override.hasSemanticIntent,
    sort: override.sort,
  };
}

export function firstPageBody(params: SearchParams): SearchRequest {
  return params.override
    ? { query: params.query, ...overrideFields(params.override) }
    : { query: params.query };
}

export function pageBody(params: SearchParams, page: PageParam): SearchRequest {
  if (page.offset === 0 || !page.continuation) return firstPageBody(params);
  return {
    query: params.query,
    ...overrideFields(page.continuation),
    offset: page.offset,
  };
}

export function nextPageParam(
  last: SearchResponse,
  first: SearchResponse,
  params: SearchParams,
): PageParam | undefined {
  if (!last.meta.hasMore) return undefined;
  return {
    offset: last.meta.offset + last.meta.limit,
    continuation: params.override ?? {
      filters: first.applied,
      semanticQuery: first.understood.semanticQuery,
      hasSemanticIntent: first.understood.hasSemanticIntent,
      sort: first.understood.sort,
    },
  };
}

export function overrideFrom(
  current: SearchOverride | null,
  understood: SearchResponse["understood"],
  filters: SearchFilters,
  sort?: SearchSort | null,
): SearchOverride {
  const base = current ?? {
    semanticQuery: understood.semanticQuery,
    hasSemanticIntent: understood.hasSemanticIntent,
    sort: understood.sort,
  };
  return {
    filters,
    semanticQuery: base.semanticQuery,
    hasSemanticIntent: base.hasSemanticIntent,
    sort: sort === undefined ? base.sort : sort,
  };
}

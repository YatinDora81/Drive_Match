"use client";

import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, isRetryable } from "../lib/api";
import { qk } from "../lib/query-keys";
import {
  FIRST_PAGE,
  firstPageBody,
  nextPageParam,
  pageBody,
  type SearchParams,
} from "../lib/search-request";
import type { SearchResponse } from "../lib/types";

export function useSearch(params: SearchParams | null) {
  return useInfiniteQuery({
    queryKey: qk.search(params),
    enabled: params !== null,
    initialPageParam: FIRST_PAGE,
    queryFn: ({ pageParam, signal }) =>
      api.search(pageBody(params as SearchParams, pageParam), signal),
    getNextPageParam: (last, pages) => {
      const first = pages[0];
      if (!first || !params) return undefined;
      return nextPageParam(last, first, params);
    },
    placeholderData: (previous, previousQuery) =>
      params && previousQuery?.queryKey[1] === params.query ? previous : undefined,
    retry: (count, error) => count < 1 && isRetryable(error),
    staleTime: 60_000,
  });
}

export function useSummary() {
  return useMutation({
    mutationFn: (params: SearchParams) =>
      api.search({ ...firstPageBody(params), explain: true }),
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not summarise these results",
      );
    },
  });
}

export function useParse(query: string, enabled: boolean) {
  return useQuery({
    queryKey: qk.parse(query),
    queryFn: ({ signal }) => api.parse(query, signal),
    enabled: enabled && query.trim().length >= 2,
    staleTime: 5 * 60_000,
  });
}

export type SearchQuery = ReturnType<typeof useSearch>;
export type { SearchResponse };

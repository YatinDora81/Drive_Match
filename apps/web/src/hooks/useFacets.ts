"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { qk } from "../lib/query-keys";

export function useFacets() {
  return useQuery({
    queryKey: qk.facets,
    queryFn: ({ signal }) => api.facets(signal),
    staleTime: 5 * 60_000,
  });
}

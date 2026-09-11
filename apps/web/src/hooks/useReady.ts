"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { qk } from "../lib/query-keys";

export function useReady() {
  return useQuery({
    queryKey: qk.ready,
    queryFn: ({ signal }) => api.ready(signal),
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: false,
  });
}

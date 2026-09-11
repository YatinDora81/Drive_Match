"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { qk } from "../lib/query-keys";
import type { Vehicle } from "../lib/types";

export function useVehicle(id: string | null, seed: Vehicle | null) {
  return useQuery({
    queryKey: qk.vehicle(id ?? ""),
    queryFn: ({ signal }) => api.vehicle(id as string, signal),
    enabled: Boolean(id),
    placeholderData: seed ?? undefined,
    staleTime: 5 * 60_000,
  });
}

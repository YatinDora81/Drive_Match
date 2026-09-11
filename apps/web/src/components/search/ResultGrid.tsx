"use client";

import type { SearchFilters, SearchResult } from "../../lib/types";
import { VehicleCard } from "./VehicleCard";

type Props = {
  results: SearchResult[];
  requested: SearchFilters;
  debug: boolean;
  dimmed: boolean;
  onOpen: (result: SearchResult) => void;
};

export function ResultGrid({ results, requested, debug, dimmed, onOpen }: Props) {
  return (
    <ul
      aria-busy={dimmed || undefined}
      className={`grid grid-cols-1 gap-4 transition-opacity duration-200 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
        dimmed ? "pointer-events-none opacity-40" : "opacity-100"
      }`}
    >
      {results.map((result, index) => (
        <li key={result.vehicle.id} className="animate-rise">
          <VehicleCard
            result={result}
            requested={requested}
            debug={debug}
            index={index}
            onOpen={onOpen}
          />
        </li>
      ))}
    </ul>
  );
}

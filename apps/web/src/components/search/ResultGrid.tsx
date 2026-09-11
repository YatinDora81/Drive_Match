"use client";

import type { SearchFilters, SearchMeta, SearchResult, SearchSort } from "../../lib/types";
import { VehicleCard } from "./VehicleCard";

type Props = {
  results: SearchResult[];
  requested: SearchFilters;
  debug: boolean;
  dimmed: boolean;
  crown: string | null;
  onOpen: (result: SearchResult) => void;
};

export function ResultGrid({ results, requested, debug, dimmed, crown, onOpen }: Props) {
  return (
    <ul
      aria-busy={dimmed || undefined}
      className={`grid grid-cols-[repeat(auto-fill,minmax(min(272px,100%),1fr))] gap-4 transition-opacity duration-200 ${
        dimmed ? "pointer-events-none opacity-40" : ""
      }`}
    >
      {results.map((result, index) => (
        <li
          key={result.vehicle.id}
          className="animate-rise"
          style={{ animationDelay: `${(index % 12) * 24}ms` }}
        >
          <VehicleCard
            result={result}
            requested={requested}
            debug={debug}
            index={index}
            crown={index === 0 ? crown : null}
            onOpen={onOpen}
          />
        </li>
      ))}
    </ul>
  );
}

export function crownFor(meta: SearchMeta, sort: SearchSort | null): string | null {
  if (meta.rankedBy === "similarity") {
    return meta.relaxed.length ? "Closest match" : "Best match";
  }
  if (meta.rankedBy !== "sort" || !sort) return null;

  const { field, direction } = sort;
  if (field === "relevance") return "Best match";
  if (field === "price") return direction === "asc" ? "Cheapest" : "Priciest";
  if (field === "kmDriven" && direction === "asc") return "Least driven";
  if (field === "year" && direction === "desc") return "Newest";
  if (field === "safetyRating" && direction === "desc") return "Safest";
  if (field === "mileageKmpl" && direction === "desc") return "Most efficient";
  return null;
}

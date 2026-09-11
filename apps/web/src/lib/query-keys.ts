import type { SearchParams } from "./search-request";

export const qk = {
  facets: ["facets"] as const,
  vehicle: (id: string) => ["vehicle", id] as const,
  parse: (query: string) => ["parse", query] as const,
  search: (params: SearchParams | null) =>
    [
      "search",
      params?.query ?? "",
      params?.override?.filters ?? null,
      params?.override?.semanticQuery ?? null,
      params?.override?.hasSemanticIntent ?? null,
      params?.override?.sort ?? null,
    ] as const,
};

export type SearchKey = ReturnType<typeof qk.search>;

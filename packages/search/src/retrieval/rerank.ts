import type { SearchFilters } from "@repo/contracts";

export const FEATURE_BOOST = 0.06;
export const COLOR_BOOST = 0.03;

export type Candidate<T> = {
  id: string;
  score: number;
  features: string[];
  color: string;
  payload: T;
};

export type Reranked<T> = Candidate<T> & {
  finalScore: number;
  matchedFeatures: string[];
};

export function rerank<T>(
  candidates: Candidate<T>[],
  filters: SearchFilters,
): Reranked<T>[] {
  const wanted = new Set(
    (filters.features ?? []).map((feature) => feature.toLowerCase()),
  );
  const colors = new Set(
    (filters.colors ?? []).map((color) => color.toLowerCase()),
  );

  const scored = candidates.map((candidate, index) => {
    const matchedFeatures = candidate.features.filter((feature) =>
      wanted.has(feature.toLowerCase()),
    );
    const colorMatch = colors.has(candidate.color.toLowerCase()) ? 1 : 0;

    return {
      ...candidate,
      matchedFeatures,
      finalScore:
        candidate.score +
        FEATURE_BOOST * matchedFeatures.length +
        COLOR_BOOST * colorMatch,
      index,
    };
  });

  scored.sort((a, b) => b.finalScore - a.finalScore || a.index - b.index);

  return scored.map(({ index: _index, ...rest }) => rest);
}

export function matchedFeatures(
  features: string[],
  filters: SearchFilters,
): string[] {
  const wanted = new Set(
    (filters.features ?? []).map((feature) => feature.toLowerCase()),
  );
  return features.filter((feature) => wanted.has(feature.toLowerCase()));
}

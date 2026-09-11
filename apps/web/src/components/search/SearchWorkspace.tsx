"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useFacets } from "../../hooks/useFacets";
import { useRecents } from "../../hooks/useRecents";
import { useSearch, useSummary } from "../../hooks/useSearch";
import { ApiError } from "../../lib/api";
import { formatCount } from "../../lib/format";
import { qk } from "../../lib/query-keys";
import {
  overrideFrom,
  type SearchOverride,
  type SearchParams,
} from "../../lib/search-request";
import type { SearchFilters, SearchResult, SearchSort } from "../../lib/types";
import { EmptyPane } from "../states/EmptyPane";
import { FailedPane } from "../states/FailedPane";
import { LoadingGrid, LoadingLine } from "../states/LoadingGrid";
import { StartPane } from "../states/StartPane";
import { UnsupportedPane } from "../states/UnsupportedPane";
import { ExampleChips, useRotatingExample } from "./ExampleChips";
import { LoadMore } from "./LoadMore";
import { RecentSearches } from "./RecentSearches";
import { RelaxedBanner } from "./RelaxedBanner";
import { ResultGrid } from "./ResultGrid";
import { ResultsHeader } from "./ResultsHeader";
import { SearchBar } from "./SearchBar";
import { UnderstoodRow } from "./UnderstoodRow";
import { VehicleSheet } from "./VehicleSheet";

const MIN_QUERY = 2;

function syncUrl(query: string | null): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (query) url.searchParams.set("q", query);
  else url.searchParams.delete("q");
  window.history.replaceState(null, "", url.toString());
}

export function SearchWorkspace() {
  const searchParams = useSearchParams();
  const initial = (searchParams.get("q") ?? "").trim();

  const [input, setInput] = useState(initial);
  const [params, setParams] = useState<SearchParams | null>(() =>
    initial.length >= MIN_QUERY ? { query: initial, override: null } : null,
  );
  const [debug, setDebug] = useState(false);
  const [open, setOpen] = useState<SearchResult | null>(null);
  const [summary, setSummary] = useState<{ key: string; text: string } | null>(
    null,
  );
  const focusIndex = useRef<number | null>(null);

  const search = useSearch(params);
  const facets = useFacets();
  const summarize = useSummary();
  const { recents, add: addRecent, clear: clearRecents } = useRecents();
  const rotating = useRotatingExample();

  const pages = useMemo(() => search.data?.pages ?? [], [search.data]);
  const first = pages[0];
  const last = pages[pages.length - 1];
  const results = useMemo(() => pages.flatMap((page) => page.results), [pages]);
  const keyHash = JSON.stringify(qk.search(params));
  const overrideMode = Boolean(params?.override);
  const searching = search.isFetching && !search.isFetchingNextPage;

  const run = useCallback((query: string, override: SearchOverride | null) => {
    focusIndex.current = null;
    setOpen(null);
    setParams({ query, override });
    syncUrl(query);
  }, []);

  const refetch = search.refetch;
  const submit = useCallback(
    (query: string) => {
      const clean = query.trim();
      if (clean.length < MIN_QUERY) return;
      setInput(clean);
      if (params && params.query === clean && params.override === null) {
        void refetch();
      } else {
        run(clean, null);
      }
      addRecent(clean);
    },
    [params, refetch, run, addRecent],
  );

  const editFilters = (filters: SearchFilters, sort?: SearchSort | null) => {
    if (!params || !first) return;
    run(
      params.query,
      overrideFrom(params.override, first.understood, filters, sort),
    );
  };

  const undo = () => {
    if (params) run(params.query, null);
  };

  const reset = () => {
    setParams(null);
    setInput("");
    setOpen(null);
    syncUrl(null);
  };

  const loadMore = async () => {
    focusIndex.current = results.length;
    const outcome = await search.fetchNextPage();
    if (outcome.isError) focusIndex.current = null;
  };

  useEffect(() => {
    const index = focusIndex.current;
    if (index === null || results.length <= index) return;
    focusIndex.current = null;
    const card = document.querySelector<HTMLElement>(
      `[data-card-index="${index}"]`,
    );
    card?.focus();
  }, [results.length]);

  const onSummarize = () => {
    if (!params) return;
    const key = keyHash;
    summarize.mutate(params, {
      onSuccess: (response) => {
        if (response.summary) setSummary({ key, text: response.summary });
        else toast("The model did not return a summary for this result set.");
      },
    });
  };

  const closeSheet = useCallback(() => setOpen(null), []);
  const backToTop = () => window.scrollTo({ top: 0 });

  const requested = params?.override ? params.override.filters : first?.requested;
  const sort = params?.override
    ? params.override.sort
    : (first?.understood.sort ?? null);
  const semantic = params?.override
    ? {
        has: params.override.hasSemanticIntent,
        text: params.override.semanticQuery,
      }
    : first
      ? {
          has: first.understood.hasSemanticIntent,
          text: first.understood.semanticQuery,
        }
      : { has: false, text: "" };

  const pageError = search.isFetchNextPageError ? search.error : null;
  const error = search.status === "error" && !pageError ? search.error : null;
  const apiError = error instanceof ApiError ? error : null;
  const unsupported = apiError?.code === "UNSUPPORTED_QUERY";
  const catalogueTotal = facets.data?.total ?? first?.meta.catalogueSize ?? null;
  const totalMs = first?.meta.timings.totalMs ?? null;
  const activeSummary = summary && summary.key === keyHash ? summary.text : null;

  const live = useMemo(() => {
    if (!params) return "";
    if (search.status === "pending" || searching) return "Searching…";
    if (pageError) {
      const cause = pageError instanceof Error ? ` ${pageError.message}` : "";
      return `Could not load more results.${cause}`;
    }
    if (search.status === "error") {
      return error instanceof Error ? error.message : "The search failed.";
    }
    if (!first || !last) return "";
    if (pages.length > 1) return `Loaded ${last.meta.returned} more`;
    const total = first.meta.total ?? results.length;
    if (first.meta.relaxed.length > 0) return `0 exact, ${total} close matches`;
    return `${total} cars found`;
  }, [
    params,
    search.status,
    searching,
    pageError,
    error,
    first,
    last,
    pages.length,
    results.length,
  ]);

  return (
    <>
      <SearchBar
        value={input}
        onChange={setInput}
        onSubmit={submit}
        busy={searching}
        catalogueTotal={catalogueTotal}
        totalMs={totalMs}
      >
        {params && !unsupported ? (
          <ExampleChips
            variant="inline"
            rotating={rotating}
            onPick={submit}
            disabled={searching}
          />
        ) : null}
      </SearchBar>

      <p aria-live="polite" className="sr-only">
        {live}
      </p>

      {params === null ? (
        <main className="pb-20">
          <StartPane>
            <ExampleChips variant="hero" rotating={rotating} onPick={submit} />
          </StartPane>
          <div className="mx-auto max-w-[1240px] px-5 pt-6 md:px-8">
            <RecentSearches
              recents={recents}
              onPick={submit}
              onClear={clearRecents}
              align="center"
            />
          </div>
        </main>
      ) : (
        <main className="mx-auto flex max-w-[1240px] flex-col gap-5 px-5 pb-20 pt-5 md:px-8">
          {first && requested && !error ? (
            <UnderstoodRow
              query={params.query}
              requested={requested}
              understood={first.understood}
              sort={sort}
              semantic={semantic}
              overrideMode={overrideMode}
              busy={searching}
              debug={debug}
              onRemoveChip={(remaining) => editFilters(remaining)}
              onRemoveSort={() => editFilters(requested, null)}
              onUndo={undo}
              onRetryAi={() => void search.refetch()}
            />
          ) : null}

          {search.status === "pending" ? (
            <LoadingGrid key={keyHash} count={6} />
          ) : error ? (
            unsupported ? (
              <UnsupportedPane message={apiError?.message ?? null}>
                <ExampleChips variant="hero" rotating={rotating} onPick={submit} />
              </UnsupportedPane>
            ) : (
              <FailedPane
                error={error}
                busy={searching}
                onRetry={() => void search.refetch()}
              />
            )
          ) : first && requested ? (
            results.length === 0 ? (
              search.isPlaceholderData ? (
                <LoadingGrid count={6} />
              ) : (
                <EmptyPane
                  requested={requested}
                  overrideMode={overrideMode}
                  onUndo={undo}
                  onReset={reset}
                />
              )
            ) : (
              <>
                {first.meta.relaxed.length > 0 && !search.isPlaceholderData ? (
                  <RelaxedBanner
                    steps={first.meta.relaxed}
                    requested={first.requested}
                    applied={first.applied}
                    busy={searching}
                    onRestore={(filters) => editFilters(filters)}
                  />
                ) : null}

                {search.isPlaceholderData ? (
                  <LoadingLine />
                ) : (
                  <ResultsHeader
                    page={first}
                    shown={results.length}
                    debug={debug}
                    onToggleDebug={() => setDebug((value) => !value)}
                    onSummarize={onSummarize}
                    summarizing={summarize.isPending}
                    summary={activeSummary}
                  />
                )}

                <ResultGrid
                  results={results}
                  requested={first.requested}
                  debug={debug}
                  dimmed={search.isPlaceholderData}
                  onOpen={setOpen}
                />

                {!search.isPlaceholderData && last ? (
                  <LoadMore
                    hasMore={last.meta.hasMore}
                    capped={last.meta.capped}
                    limit={last.meta.limit}
                    shown={results.length}
                    total={first.meta.total}
                    pageCount={pages.length}
                    loading={search.isFetchingNextPage}
                    error={pageError}
                    onLoadMore={() => void loadMore()}
                    onBackToTop={backToTop}
                  />
                ) : null}
              </>
            )
          ) : null}

          {recents.length > 0 ? (
            <div className="mt-6 border-t border-rule pt-6">
              <RecentSearches
                recents={recents}
                onPick={submit}
                onClear={clearRecents}
              />
            </div>
          ) : null}

          {first && debug ? (
            <p className="font-mono text-[10px] text-ink-3">
              catalogue {formatCount(first.meta.catalogueSize)} vehicles
            </p>
          ) : null}
        </main>
      )}

      {open ? (
        <VehicleSheet
          seed={open.vehicle}
          matchedFeatures={open.matchedFeatures}
          onClose={closeSheet}
        />
      ) : null}
    </>
  );
}

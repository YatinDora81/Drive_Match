"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useShell } from "../layout/shell-context";
import { TopBar } from "../layout/TopBar";
import { EmptyPane } from "../states/EmptyPane";
import { FailedPane } from "../states/FailedPane";
import { LoadingGrid, LoadingLine } from "../states/LoadingGrid";
import { UnsupportedPane } from "../states/UnsupportedPane";
import { FactTiles } from "./FactTiles";
import { Hero } from "./Hero";
import { LoadMore } from "./LoadMore";
import { RelaxedBanner } from "./RelaxedBanner";
import { ResultGrid, crownFor } from "./ResultGrid";
import { ResultsHeader } from "./ResultsHeader";
import { SummaryNote, type SummaryState } from "./SummaryNote";
import { TopSearch } from "./TopSearch";
import { UnderstoodPanel } from "./UnderstoodPanel";
import { VehicleSheet } from "./VehicleSheet";

const MIN_QUERY = 2;

type Summary = { key: string; text: string | null; failed: boolean };

function syncUrl(query: string | null): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (query) url.searchParams.set("q", query);
  else url.searchParams.delete("q");
  window.history.replaceState(null, "", url.toString());
}

export function SearchWorkspace() {
  const searchParams = useSearchParams();
  const urlQuery = (searchParams.get("q") ?? "").trim();

  const [input, setInput] = useState(urlQuery);
  const [params, setParams] = useState<SearchParams | null>(() =>
    urlQuery.length >= MIN_QUERY ? { query: urlQuery, override: null } : null,
  );
  const [debug, setDebug] = useState(false);
  const [open, setOpen] = useState<SearchResult | null>(null);
  const [wantSummary, setWantSummary] = useState(false);
  const [exactOnly, setExactOnly] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [askedKey, setAskedKey] = useState<string | null>(null);
  const focusIndex = useRef<number | null>(null);

  const search = useSearch(params);
  const { mutate: requestSummary } = useSummary();
  const { addRecent } = useShell();

  const pages = useMemo(() => search.data?.pages ?? [], [search.data]);
  const first = pages[0];
  const last = pages[pages.length - 1];
  const results = useMemo(() => pages.flatMap((page) => page.results), [pages]);
  const keyHash = JSON.stringify(qk.search(params));
  const mode: "auto" | "edit" | "exact" = params?.override
    ? (params.override.source ?? "edit")
    : "auto";
  const searching = search.isFetching && !search.isFetchingNextPage;
  const settled = Boolean(first) && !search.isPlaceholderData;
  const needsExact =
    exactOnly &&
    settled &&
    params !== null &&
    params.override === null &&
    (first?.meta.relaxed.length ?? 0) > 0;

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

  const reset = useCallback(() => {
    setParams(null);
    setInput("");
    setOpen(null);
    syncUrl(null);
  }, []);

  const latest = useRef({ params, run, reset, addRecent });
  useEffect(() => {
    latest.current = { params, run, reset, addRecent };
  });

  useEffect(() => {
    const current = latest.current;
    if (urlQuery.length >= MIN_QUERY) {
      if (current.params?.query !== urlQuery) {
        setInput(urlQuery);
        current.run(urlQuery, null);
        current.addRecent(urlQuery);
      }
    } else if (current.params !== null) {
      current.reset();
    }
  }, [urlQuery]);

  useEffect(() => {
    if (!needsExact || !params || !first) return;
    run(params.query, {
      ...overrideFrom(null, first.understood, first.requested),
      source: "exact",
    });
  }, [needsExact, params, first, run]);

  const askSummary = useCallback(
    (key: string, target: SearchParams) => {
      setAskedKey(key);
      setSummary(null);
      requestSummary(target, {
        onSuccess: (response) => setSummary({ key, text: response.summary, failed: false }),
        onError: () => setSummary({ key, text: null, failed: true }),
      });
    },
    [requestSummary],
  );

  useEffect(() => {
    if (!wantSummary || !params || !settled || needsExact || results.length === 0) return;
    if (askedKey === keyHash) return;
    askSummary(keyHash, params);
  }, [wantSummary, params, settled, needsExact, results.length, askedKey, keyHash, askSummary]);

  const editFilters = (filters: SearchFilters, sort?: SearchSort | null) => {
    if (!params || !first) return;
    run(params.query, overrideFrom(params.override, first.understood, filters, sort));
  };

  const undo = () => {
    if (params) run(params.query, null);
  };

  const toggleExact = () => {
    const next = !exactOnly;
    setExactOnly(next);
    if (!next && params?.override?.source === "exact") run(params.query, null);
  };

  const toggleSummary = () => setWantSummary((value) => !value);

  const loadMore = async () => {
    focusIndex.current = results.length;
    const outcome = await search.fetchNextPage();
    if (outcome.isError) focusIndex.current = null;
  };

  useEffect(() => {
    const index = focusIndex.current;
    if (index === null || results.length <= index) return;
    focusIndex.current = null;
    document.querySelector<HTMLElement>(`[data-card-index="${index}"]`)?.focus();
  }, [results.length]);

  const closeSheet = useCallback(() => setOpen(null), []);
  const backToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const requested = params?.override ? params.override.filters : first?.requested;
  const sort = params?.override ? params.override.sort : (first?.understood.sort ?? null);
  const semantic = params?.override
    ? { has: params.override.hasSemanticIntent, text: params.override.semanticQuery }
    : first
      ? { has: first.understood.hasSemanticIntent, text: first.understood.semanticQuery }
      : { has: false, text: "" };

  const pageError = search.isFetchNextPageError ? search.error : null;
  const error = search.status === "error" && !pageError ? search.error : null;
  const apiError = error instanceof ApiError ? error : null;
  const unsupported = apiError?.code === "UNSUPPORTED_QUERY";

  const activeSummary = summary && summary.key === keyHash ? summary : null;
  const summaryState: SummaryState | null = !wantSummary
    ? null
    : activeSummary
      ? activeSummary.failed
        ? "failed"
        : "done"
      : askedKey === keyHash
        ? "pending"
        : null;

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
  }, [params, search.status, searching, pageError, error, first, last, pages.length, results.length]);

  if (params === null) {
    return (
      <>
        <TopBar />
        <main className="flex flex-1 flex-col">
          <Hero
            value={input}
            onChange={setInput}
            onSubmit={submit}
            wantSummary={wantSummary}
            onToggleSummary={toggleSummary}
            exactOnly={exactOnly}
            onToggleExact={toggleExact}
          />
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar>
        <TopSearch value={input} onChange={setInput} onSubmit={submit} busy={searching} />
      </TopBar>

      <p aria-live="polite" className="sr-only">
        {live}
      </p>

      <main className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col gap-5 px-4 pt-6 pb-16 md:px-8">
        {first && requested && !error && !needsExact ? (
          <UnderstoodPanel
            query={params.query}
            requested={requested}
            understood={first.understood}
            meta={first.meta}
            sort={sort}
            semantic={semantic}
            mode={mode}
            busy={searching}
            debug={debug}
            onRemoveChip={(remaining) => editFilters(remaining)}
            onRemoveSort={() => editFilters(requested, null)}
            onUndo={undo}
            onRetryAi={() => void search.refetch()}
          />
        ) : null}

        {search.status === "pending" || needsExact ? (
          <LoadingGrid key={keyHash} count={6} />
        ) : error ? (
          unsupported ? (
            <UnsupportedPane message={apiError?.message ?? null} onPick={submit} />
          ) : (
            <FailedPane error={error} busy={searching} onRetry={() => void search.refetch()} />
          )
        ) : first && requested ? (
          results.length === 0 ? (
            search.isPlaceholderData ? (
              <LoadingGrid count={6} />
            ) : (
              <EmptyPane
                requested={requested}
                mode={mode}
                onUndo={undo}
                onReset={reset}
                onAllowClose={toggleExact}
              />
            )
          ) : (
            <>
              {search.isPlaceholderData ? (
                <LoadingLine />
              ) : (
                <ResultsHeader
                  page={first}
                  shown={results.length}
                  debug={debug}
                  onToggleDebug={() => setDebug((value) => !value)}
                  wantSummary={wantSummary}
                  onToggleSummary={toggleSummary}
                  exactOnly={exactOnly}
                  onToggleExact={toggleExact}
                />
              )}

              {!search.isPlaceholderData ? (
                <FactTiles results={results} total={first.meta.total} />
              ) : null}

              {first.meta.relaxed.length > 0 && !search.isPlaceholderData ? (
                <RelaxedBanner
                  steps={first.meta.relaxed}
                  requested={first.requested}
                  applied={first.applied}
                  busy={searching}
                  onRestore={(filters) => editFilters(filters)}
                />
              ) : null}

              {summaryState ? (
                <SummaryNote
                  state={summaryState}
                  text={activeSummary?.text ?? null}
                  model={first.meta.model.generation}
                  onRetry={() => askSummary(keyHash, params)}
                />
              ) : null}

              <ResultGrid
                results={results}
                requested={first.requested}
                debug={debug}
                dimmed={search.isPlaceholderData}
                crown={crownFor(first.meta, sort)}
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

        {first && debug ? (
          <p className="font-mono text-[10.5px] text-ink-3">
            catalogue {formatCount(first.meta.catalogueSize)} vehicles
          </p>
        ) : null}
      </main>

      {open && first ? (
        <VehicleSheet
          seed={open.vehicle}
          matchedFeatures={open.matchedFeatures}
          requested={first.requested}
          onClose={closeSheet}
        />
      ) : null}
    </>
  );
}

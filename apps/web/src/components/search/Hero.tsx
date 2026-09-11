"use client";

import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useFacets } from "../../hooks/useFacets";
import { useSlashFocus } from "../../hooks/useSlashFocus";
import { useTypewriter } from "../../hooks/useTypewriter";
import { formatCount, formatInr } from "../../lib/format";
import { ArrowRightIcon, SearchIcon } from "../icons";
import { Button } from "../ui/Button";
import { Kbd } from "../ui/Kbd";
import { StatTile } from "../ui/StatTile";
import { Toggle } from "../ui/Toggle";
import { Ideas } from "./Ideas";
import { PLACEHOLDERS } from "./presets";

const MIN_QUERY = 2;

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (q: string) => void;
  wantSummary: boolean;
  onToggleSummary: () => void;
  exactOnly: boolean;
  onToggleExact: () => void;
};

export function Hero({
  value,
  onChange,
  onSubmit,
  wantSummary,
  onToggleSummary,
  exactOnly,
  onToggleExact,
}: Props) {
  const inputId = useId();
  const hintId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [tooShort, setTooShort] = useState(false);
  const facets = useFacets();
  const placeholder = useTypewriter(PLACEHOLDERS, value.length === 0);

  useSlashFocus(inputRef);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = value.trim();
    if (query.length < MIN_QUERY) {
      setTooShort(true);
      inputRef.current?.focus();
      return;
    }
    setTooShort(false);
    onSubmit(query);
  };

  const change = (next: string) => {
    if (tooShort) setTooShort(false);
    onChange(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape" && value) {
      event.preventDefault();
      change("");
    }
  };

  const data = facets.data;

  return (
    <section
      aria-labelledby="hero-title"
      className="animate-rise mx-auto w-full max-w-[1180px] px-4 pt-[clamp(2.5rem,8vh,5rem)] pb-16 md:px-8"
    >
      <div className="max-w-[760px]">
        <p className="inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 text-[12.5px] leading-none font-semibold text-ink-2 shadow-card">
          <i aria-hidden="true" className="block size-1.5 shrink-0 rounded-full bg-grass" />
          <span className="min-w-0 truncate tabular-nums">
            {data ? `AI search over ${formatCount(data.total)} used cars` : "AI search over used cars"}
          </span>
        </p>

        <h1
          id="hero-title"
          className="mt-5 text-[clamp(2rem,4.6vw,3.1rem)] leading-[1.05] font-extrabold tracking-[-0.04em] text-balance text-ink"
        >
          What car are you looking for?
        </h1>

        <p className="mt-4 max-w-[56ch] text-[16px] leading-relaxed text-ink-2">
          Type it the way you’d say it out loud. Budget, fuel, city, seats, whatever matters to
          you. You’ll see exactly what was understood before any results show up.
        </p>

        <form role="search" noValidate onSubmit={submit} className="mt-7">
          <div className="flex flex-wrap items-center gap-2 rounded-panel border border-line bg-card p-2 pl-4 shadow-card transition-[border-color,box-shadow] duration-150 focus-within:border-brand focus-within:shadow-up sm:flex-nowrap">
            <SearchIcon className="size-5 shrink-0 text-ink-3" />
            <label htmlFor={inputId} className="sr-only">
              Describe the car you want
            </label>
            <input
              id={inputId}
              ref={inputRef}
              type="text"
              value={value}
              onChange={(event) => change(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder={placeholder || " "}
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="search"
              maxLength={500}
              aria-describedby={hintId}
              className="min-w-0 flex-1 bg-transparent py-3 text-[16px] font-medium text-ink outline-none placeholder:font-normal placeholder:text-ink-3"
            />
            <Button type="submit" size="lg" shape="rounded" className="w-full sm:w-auto">
              Find cars <ArrowRightIcon />
            </Button>
          </div>
          <p id={hintId} aria-live="polite" className="mt-3 text-[12.5px] text-ink-3">
            {tooShort ? (
              "Type at least two characters."
            ) : (
              <>
                Press <Kbd>/</Kbd> to focus, <Kbd>esc</Kbd> to clear
              </>
            )}
          </p>
        </form>

        <div className="mt-5">
          <Ideas onPick={onSubmit} />
        </div>

        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1">
          <Toggle pressed={wantSummary} onClick={onToggleSummary}>
            Also write me a summary
          </Toggle>
          <Toggle pressed={exactOnly} onClick={onToggleExact}>
            Exact matches only
          </Toggle>
        </div>
      </div>

      {data ? (
        <div className="animate-fade mt-14">
          <h2 className="text-[11.5px] font-bold text-ink-3">In the catalogue</h2>
          {/* Three counts share a row; the price range is twice as long, so it gets a full
              row on phones and a double column from md up instead of truncating. */}
          <div className="mt-3 grid grid-cols-3 gap-3 md:grid-cols-5">
            <StatTile tone="brand" label="Cars" value={formatCount(data.total)} />
            <StatTile tone="hybrid" label="Brands" value={formatCount(data.makes.length)} />
            <StatTile tone="petrol" label="Cities" value={formatCount(data.cities.length)} />
            <div className="col-span-3 min-w-0 md:col-span-2">
              <StatTile
                tone="grass"
                label="Price range"
                value={`${formatInr(data.price.min)} – ${formatInr(data.price.max)}`}
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

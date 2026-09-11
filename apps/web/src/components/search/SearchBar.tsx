"use client";

import {
  useEffect,
  useId,
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { formatCount, formatMs } from "../../lib/format";
import { SearchIcon } from "../icons";
import { Kbd } from "../ui/Kbd";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (query: string) => void;
  busy: boolean;
  catalogueTotal: number | null;
  totalMs: number | null;
  children?: React.ReactNode;
};

const isEditable = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
};

export function SearchBar({
  value,
  onChange,
  onSubmit,
  busy,
  catalogueTotal,
  totalMs,
  children,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const tooShort = value.trim().length > 0 && value.trim().length < 2;

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey)
        return;
      if (isEditable(event.target)) return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = value.trim();
    if (query.length < 2) {
      inputRef.current?.focus();
      return;
    }
    onSubmit(query);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    onChange("");
  };

  const footerBits: string[] = [];
  if (catalogueTotal !== null)
    footerBits.push(`Searching ${formatCount(catalogueTotal)} cars`);
  if (totalMs !== null) footerBits.push(formatMs(totalMs));

  return (
    <div className="sticky top-0 z-[300] border-b border-rule bg-paper/95 backdrop-blur">
      <div className="mx-auto max-w-[1240px] px-5 pb-2.5 pt-3.5 md:px-8">
        <form role="search" onSubmit={submit} noValidate>
          <label
            htmlFor={id}
            className="mb-1.5 block text-[11.5px] font-medium tracking-[-0.004em] text-ink-2"
          >
            Describe the car you want
          </label>
          <div className="flex items-center gap-2.5 rounded-xl border border-rule-2 bg-paper-2 py-1.5 pl-[15px] pr-1.5 transition-[border-color,box-shadow] duration-200 focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent-bg">
            <SearchIcon className="size-[16px] shrink-0 text-ink-3" />
            <input
              ref={inputRef}
              id={id}
              name="q"
              type="text"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Automatic SUV under 15 lakh in Pune with a sunroof…"
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="search"
              maxLength={500}
              aria-describedby={`${id}-hint`}
              aria-invalid={tooShort || undefined}
              className="min-w-0 flex-1 bg-transparent py-2 text-[16px] leading-[1.45] tracking-[-0.01em] text-ink outline-none placeholder:text-ink-3 md:text-[17px]"
            />
            <button
              type="submit"
              className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-accent px-3.5 text-[12.5px] font-medium text-accent-fg transition-[background-color,opacity] duration-[180ms] hover:bg-accent-2 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-bg disabled:cursor-default disabled:opacity-60"
            >
              {busy ? "Searching…" : "Search"}
            </button>
          </div>
          <div
            id={`${id}-hint`}
            className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-mono text-[10px] text-ink-3"
          >
            <span>
              {tooShort
                ? "Type at least two characters."
                : footerBits.length > 0
                  ? footerBits.join(" · ")
                  : "Plain words. No filters to learn."}
            </span>
            <span className="flex items-center gap-2.5">
              <span className="flex items-center gap-1.5">
                <Kbd>/</Kbd> focus
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>↵</Kbd> search
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>esc</Kbd> clear
              </span>
            </span>
          </div>
        </form>
        {children ? <div className="mt-1.5">{children}</div> : null}
      </div>
    </div>
  );
}

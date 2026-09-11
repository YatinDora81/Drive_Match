"use client";

import {
  useEffect,
  useId,
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { formatCount, formatMs } from "../../lib/format";
import { ArrowUpIcon, SearchIcon } from "../icons";
import { IconButton } from "../ui/IconButton";

type Props = {
  variant: "hero" | "compact";
  value: string;
  onChange: (value: string) => void;
  onSubmit: (query: string) => void;
  busy: boolean;
  catalogueTotal: number | null;
  totalMs: number | null;
  /** Rendered in the card's bottom row (hero) or under the field (compact). */
  children?: React.ReactNode;
};

const isEditable = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
};

const CARD =
  "rounded-card border border-input-card-line bg-input-card shadow-card transition-[border-color,box-shadow] duration-200 focus-within:border-primary-line focus-within:ring-[3px] focus-within:ring-primary-soft";

export function SearchBar({
  variant,
  value,
  onChange,
  onSubmit,
  busy,
  catalogueTotal,
  totalMs,
  children,
}: Props) {
  const fieldRef = useRef<HTMLTextAreaElement & HTMLInputElement>(null);
  const id = useId();
  const clean = value.trim();
  const tooShort = clean.length > 0 && clean.length < 2;

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey)
        return;
      if (isEditable(event.target)) return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      event.preventDefault();
      fieldRef.current?.focus();
      fieldRef.current?.select();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (clean.length < 2) {
      fieldRef.current?.focus();
      return;
    }
    onSubmit(clean);
  };

  const onKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onChange("");
      return;
    }
    if (variant === "hero" && event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const footerBits: string[] = [];
  if (catalogueTotal !== null)
    footerBits.push(`Searching ${formatCount(catalogueTotal)} cars`);
  if (totalMs !== null) footerBits.push(formatMs(totalMs));
  const hint = tooShort
    ? "Type at least two characters."
    : footerBits.length > 0
      ? footerBits.join(" · ")
      : "Plain words. No filters to learn.";

  const shared = {
    ref: fieldRef,
    id,
    name: "q",
    value,
    onChange: (event: { target: { value: string } }) => onChange(event.target.value),
    onKeyDown,
    placeholder: "Automatic SUV under 15 lakh in Pune with a sunroof…",
    autoComplete: "off",
    spellCheck: false,
    maxLength: 500,
    "aria-describedby": `${id}-hint`,
    "aria-invalid": tooShort || undefined,
  } as const;

  if (variant === "hero") {
    return (
      <form
        role="search"
        onSubmit={submit}
        noValidate
        className={`${CARD} mx-auto mt-9 w-full max-w-[1040px] p-3 md:p-4`}
      >
        <label htmlFor={id} className="sr-only">
          Describe the car you want
        </label>
        <div className="rounded-field border border-field-line bg-field px-5 pb-3 pt-4">
          <textarea
            {...shared}
            rows={4}
            enterKeyHint="search"
            className="block w-full resize-none bg-transparent text-[15.5px] leading-[1.55] text-ink outline-none placeholder:text-faint"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {children}
            <span id={`${id}-hint`} className="text-[12px] text-muted">
              {hint}
            </span>
          </div>
          <IconButton
            type="submit"
            variant="primary"
            label={busy ? "Searching" : "Search"}
            disabled={busy || clean.length < 2}
            className="ml-auto"
          >
            <ArrowUpIcon className="size-[18px]" />
          </IconButton>
        </div>
      </form>
    );
  }

  return (
    <div className="sticky top-16 z-[250] px-5 pt-2 md:px-8">
      <form
        role="search"
        onSubmit={submit}
        noValidate
        className={`${CARD} mx-auto max-w-[1240px] p-2`}
      >
        <label htmlFor={id} className="sr-only">
          Describe the car you want
        </label>
        <div className="flex items-center gap-2.5 rounded-field border border-field-line bg-field py-1 pl-4 pr-1">
          <SearchIcon className="size-4 shrink-0 text-muted" />
          <input
            {...shared}
            type="text"
            enterKeyHint="search"
            className="min-w-0 flex-1 bg-transparent py-2 text-[15px] leading-[1.45] text-ink outline-none placeholder:text-faint"
          />
          <IconButton
            type="submit"
            variant="primary"
            label={busy ? "Searching" : "Search"}
            disabled={busy || clean.length < 2}
            className="size-8"
          >
            <ArrowUpIcon className="size-4" />
          </IconButton>
        </div>
        <div
          id={`${id}-hint`}
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-2 pb-0.5 pt-1.5 text-[11.5px] text-muted"
        >
          {children ?? <span />}
          <span className="ml-auto">{hint}</span>
        </div>
      </form>
    </div>
  );
}

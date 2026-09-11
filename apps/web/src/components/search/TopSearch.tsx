"use client";

import { useId, useRef, type FormEvent, type KeyboardEvent } from "react";
import { useSlashFocus } from "../../hooks/useSlashFocus";
import { ArrowRightIcon, CloseIcon, SearchIcon, SpinnerIcon } from "../icons";
import { Kbd } from "../ui/Kbd";

const MIN_QUERY = 2;

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (q: string) => void;
  busy: boolean;
};

export function TopSearch({ value, onChange, onSubmit, busy }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const query = value.trim();
  const canSubmit = query.length >= MIN_QUERY;

  useSlashFocus(inputRef);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      inputRef.current?.focus();
      return;
    }
    inputRef.current?.blur();
    onSubmit(query);
  };

  const clear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape" && value) {
      event.preventDefault();
      onChange("");
    }
  };

  return (
    <form
      role="search"
      noValidate
      onSubmit={submit}
      className="flex h-11 w-full max-w-[720px] min-w-0 items-center gap-2 rounded-full border border-line bg-card pr-1.5 pl-4 shadow-card transition-[border-color,box-shadow] duration-150 focus-within:border-brand"
    >
      <SearchIcon className="size-4 shrink-0 text-ink-3" />
      <label htmlFor={inputId} className="sr-only">
        Search cars
      </label>
      <input
        id={inputId}
        ref={inputRef}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Search cars in your own words…"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        maxLength={500}
        className="h-full min-w-0 flex-1 bg-transparent text-[14.5px] font-medium text-ink outline-none placeholder:font-normal placeholder:text-ink-3"
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          title="Clear search"
          onClick={clear}
          className="grid size-7 shrink-0 place-items-center rounded-full text-ink-3 transition-colors duration-150 hover:bg-sunk hover:text-ink"
        >
          <CloseIcon className="size-3.5" />
        </button>
      ) : (
        <span aria-hidden="true" className="hidden shrink-0 md:inline-flex">
          <Kbd>/</Kbd>
        </span>
      )}
      <button
        type="submit"
        aria-label={busy ? "Searching" : "Search"}
        title={busy ? "Searching" : "Search"}
        disabled={!canSubmit}
        className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-on-brand transition-[filter,opacity] duration-150 hover:brightness-110 disabled:cursor-default disabled:opacity-50 disabled:hover:brightness-100"
      >
        {busy ? (
          <SpinnerIcon className="size-4 animate-spin" />
        ) : (
          <ArrowRightIcon className="size-4" />
        )}
      </button>
    </form>
  );
}

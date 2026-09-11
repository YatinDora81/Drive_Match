"use client";

import { CheckIcon } from "../icons";

type Props = {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
  compact?: boolean;
  title?: string;
};

export function Toggle({ pressed, onClick, children, compact = false, title }: Props) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      title={title}
      className={`inline-flex items-center gap-2 font-semibold transition-[color,border-color,background-color] duration-150 ${
        compact
          ? `h-9 rounded-full border px-3 text-[12.5px] ${
              pressed
                ? "border-brand/40 bg-brand-soft text-brand"
                : "border-line bg-card text-ink-2 hover:text-ink"
            }`
          : `min-h-9 text-[13.5px] ${pressed ? "text-brand" : "text-ink-2 hover:text-ink"}`
      }`}
    >
      <span
        aria-hidden="true"
        className={`grid shrink-0 place-items-center rounded-[6px] border-[1.5px] transition-colors ${
          compact ? "size-4" : "size-[18px]"
        } ${pressed ? "border-brand bg-brand text-on-brand" : "border-line-2 text-transparent"}`}
      >
        <CheckIcon className={compact ? "size-2.5" : "size-3"} />
      </span>
      {children}
    </button>
  );
}

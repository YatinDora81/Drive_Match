"use client";

import type { CSSProperties } from "react";
import { SOFT, type Tone } from "../../lib/tones";
import { CloseIcon } from "../icons";

type Props = {
  tone: Tone | "neutral";
  name?: string;
  children: React.ReactNode;
  onRemove?: () => void;
  removeLabel?: string;
  disabled?: boolean;
  style?: CSSProperties;
};

export function Tag({
  tone,
  name,
  children,
  onRemove,
  removeLabel,
  disabled = false,
  style,
}: Props) {
  const look = tone === "neutral" ? "bg-sunk text-ink-2" : SOFT[tone];
  return (
    <span
      style={style}
      className={`animate-rise inline-flex max-w-full items-center gap-1.5 rounded-full py-1.5 pl-3 text-[13.5px] leading-tight font-semibold ${
        onRemove ? "pr-1.5" : "pr-3"
      } ${look}`}
    >
      {name ? (
        <span className="shrink-0 text-[11.5px] font-bold opacity-65">{name}</span>
      ) : null}
      <span className="min-w-0 truncate tabular-nums">{children}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label={removeLabel}
          title={removeLabel}
          className="relative grid size-5 shrink-0 place-items-center rounded-full bg-current/10 transition-colors after:absolute after:-inset-2 after:content-[''] hover:bg-current/20 disabled:cursor-default disabled:opacity-50"
        >
          <CloseIcon className="size-2.5" />
        </button>
      ) : null}
    </span>
  );
}

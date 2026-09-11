"use client";

import type { ButtonHTMLAttributes } from "react";
import { CloseIcon } from "../icons";

export type Tint =
  | "lavender"
  | "purple"
  | "yellow"
  | "cyan"
  | "orange"
  | "green"
  | "red"
  | "blue";

export const TINT: Record<Tint, string> = {
  lavender: "border-lavender-line bg-lavender-bg text-lavender",
  purple: "border-purple-line bg-purple-bg text-purple",
  yellow: "border-yellow-line bg-yellow-bg text-yellow",
  cyan: "border-cyan-line bg-cyan-bg text-cyan",
  orange: "border-orange-line bg-orange-bg text-orange",
  green: "border-green-line bg-green-bg text-green",
  red: "border-red-line bg-red-bg text-red",
  blue: "border-blue-line bg-blue-bg text-blue",
};

const NEUTRAL = "border-line bg-card text-body hover:bg-surface-2";

const BASE =
  "inline-flex min-h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium leading-none transition-[background-color,border-color,color,opacity,filter] duration-[160ms]";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary-line";

const HOVER_TINT = "hover:brightness-[0.97] dark:hover:brightness-[1.12]";

type ChipButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tint?: Tint;
  active?: boolean;
  icon?: React.ReactNode;
};

export function ChipButton({
  tint,
  active = true,
  icon,
  className = "",
  children,
  ...props
}: ChipButtonProps) {
  const look = tint && active ? `${TINT[tint]} ${HOVER_TINT}` : NEUTRAL;
  return (
    <button
      type="button"
      className={`${BASE} ${FOCUS} cursor-pointer disabled:cursor-default disabled:opacity-50 ${look} ${className}`}
      {...props}
    >
      {icon ? <span className="shrink-0 [&>svg]:size-4">{icon}</span> : null}
      <span className="min-w-0 truncate">{children}</span>
    </button>
  );
}

type RemovableChipProps = {
  label: string;
  tint?: Tint;
  onRemove: () => void;
  disabled?: boolean;
};

export function RemovableChip({
  label,
  tint = "lavender",
  onRemove,
  disabled = false,
}: RemovableChipProps) {
  return (
    <button
      type="button"
      aria-label={`Remove filter: ${label}`}
      title={`Remove filter: ${label}`}
      disabled={disabled}
      onClick={onRemove}
      className={`${BASE} ${FOCUS} ${TINT[tint]} ${HOVER_TINT} group cursor-pointer pr-2 disabled:cursor-default disabled:opacity-60`}
    >
      <span>{label}</span>
      <span
        aria-hidden="true"
        className="grid size-5 place-items-center rounded-full opacity-70 transition-[opacity,background-color] group-hover:bg-black/[0.06] group-hover:opacity-100 dark:group-hover:bg-white/10"
      >
        <CloseIcon className="size-3" />
      </span>
    </button>
  );
}

type StaticChipProps = {
  children: React.ReactNode;
  tint?: Tint;
  icon?: React.ReactNode;
  strike?: boolean;
  className?: string;
};

export function StaticChip({
  children,
  tint,
  icon,
  strike = false,
  className = "",
}: StaticChipProps) {
  const look = tint ? TINT[tint] : "border-line bg-surface-2 text-body";
  return (
    <span
      className={`${BASE} ${look} ${strike ? "line-through decoration-current/60" : ""} ${className}`}
    >
      {icon ? <span className="shrink-0 [&>svg]:size-4">{icon}</span> : null}
      <span>{children}</span>
    </span>
  );
}

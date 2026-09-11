"use client";

import type { ButtonHTMLAttributes } from "react";

const BASE =
  "inline-flex min-h-[32px] items-center gap-1.5 rounded-full border px-3 text-[12.5px] leading-none tracking-[-0.005em] transition-[background-color,border-color,color] duration-[160ms]";

type ChipButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "default" | "accent";
};

export function ChipButton({
  tone = "default",
  className = "",
  ...props
}: ChipButtonProps) {
  const tones =
    tone === "accent"
      ? "border-accent-bg bg-accent-bg text-accent hover:border-accent"
      : "border-rule-2 bg-paper text-ink-2 hover:border-ink-3 hover:bg-paper-2 hover:text-ink";
  return (
    <button
      type="button"
      className={`${BASE} cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-bg ${tones} ${className}`}
      {...props}
    />
  );
}

type RemovableChipProps = {
  label: string;
  onRemove: () => void;
  disabled?: boolean;
};

export function RemovableChip({
  label,
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
      className={`${BASE} group cursor-pointer border-rule-2 bg-paper text-ink hover:border-accent hover:bg-accent-bg hover:text-accent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-bg disabled:cursor-default disabled:opacity-60`}
    >
      <span>{label}</span>
      <span
        aria-hidden="true"
        className="text-[14px] leading-none text-ink-3 transition-colors group-hover:text-accent"
      >
        ×
      </span>
    </button>
  );
}

type StaticChipProps = {
  children: React.ReactNode;
  variant?: "quoted" | "strike";
  className?: string;
};

export function StaticChip({ children, variant, className = "" }: StaticChipProps) {
  const look =
    variant === "quoted"
      ? "border-dashed border-rule-2 bg-transparent italic text-ink-2"
      : variant === "strike"
        ? "border-warn-bg bg-warn-bg text-warn line-through decoration-warn/60"
        : "border-rule-2 bg-paper-2 text-ink-2";
  return <span className={`${BASE} ${look} ${className}`}>{children}</span>;
}

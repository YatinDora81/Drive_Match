"use client";

import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "outline";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary text-on-primary shadow-card hover:bg-primary-hover disabled:opacity-50 disabled:hover:bg-primary",
  ghost: "text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-50",
  outline:
    "border border-primary-line bg-card text-primary hover:bg-primary-soft disabled:opacity-50 disabled:hover:bg-card",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-button px-4 text-[13.5px] font-medium transition-[background-color,border-color,color,opacity] duration-[180ms] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary-line disabled:cursor-default ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

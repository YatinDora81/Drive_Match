"use client";

import type { ComponentPropsWithRef } from "react";

type Props = ComponentPropsWithRef<"button"> & {
  label: string;
  variant?: "outlined" | "plain" | "primary";
};

const VARIANTS = {
  outlined:
    "border border-line bg-card text-icon shadow-card hover:bg-surface-2 hover:text-ink",
  plain: "text-icon hover:bg-surface-2 hover:text-ink",
  primary:
    "bg-primary text-on-primary shadow-card hover:bg-primary-hover disabled:hover:bg-primary",
};

export function IconButton({
  label,
  variant = "outlined",
  className = "",
  ...props
}: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`grid size-9 shrink-0 place-items-center rounded-full transition-[background-color,color,opacity] duration-[160ms] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary-line disabled:cursor-default disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

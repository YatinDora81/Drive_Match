"use client";

import type { ComponentPropsWithRef } from "react";

type Props = ComponentPropsWithRef<"button"> & {
  label: string;
  variant?: "round" | "plain" | "primary";
  size?: "sm" | "md";
};

const VARIANTS = {
  round:
    "border border-line bg-card text-ink-2 shadow-card hover:border-line-2 hover:text-ink",
  plain: "text-ink-2 hover:bg-sunk hover:text-ink",
  primary: "bg-brand text-on-brand hover:brightness-110 disabled:hover:brightness-100",
};

export function IconButton({
  label,
  variant = "round",
  size = "md",
  className = "",
  ...props
}: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`grid shrink-0 place-items-center rounded-full transition-[background-color,border-color,color,filter,opacity] duration-150 disabled:cursor-default disabled:opacity-50 ${
        size === "sm" ? "size-9" : "size-10"
      } ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

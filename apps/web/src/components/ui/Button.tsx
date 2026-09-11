"use client";

import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand text-on-brand shadow-card hover:brightness-110 disabled:hover:brightness-100",
  outline:
    "border border-line bg-card text-ink shadow-card hover:border-brand hover:text-brand disabled:hover:border-line disabled:hover:text-ink",
  ghost: "text-ink-2 hover:bg-sunk hover:text-ink disabled:hover:bg-transparent",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 gap-1.5 px-3 text-[12.5px] [&_svg]:size-3.5",
  md: "h-10 gap-2 px-4 text-[13.5px] [&_svg]:size-4",
  lg: "h-12 gap-2 px-6 text-[15px] [&_svg]:size-4",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  shape?: "pill" | "rounded";
};

export function Button({
  variant = "primary",
  size = "md",
  shape = "pill",
  type = "button",
  className = "",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={`inline-flex shrink-0 items-center justify-center font-bold whitespace-nowrap transition-[background-color,border-color,color,filter,opacity] duration-150 disabled:cursor-default disabled:opacity-50 ${
        shape === "pill" ? "rounded-full" : "rounded-tile"
      } ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

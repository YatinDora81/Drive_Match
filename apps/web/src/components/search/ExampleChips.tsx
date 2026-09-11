"use client";

import { useEffect, useState } from "react";
import { ChipButton } from "../ui/Chip";

export const FIXED_EXAMPLES = [
  "Show SUVs under ₹15L",
  "Diesel automatic cars below 80k km",
  "Family cars with high safety ratings",
] as const;

export const ROTATING_EXAMPLES = [
  "Cheapest automatic hatchback in Bengaluru",
  "EV with 400 km range",
  "7 seater under 12 lakh, not diesel",
] as const;

export function useRotatingExample(): string {
  const [pick, setPick] = useState(0);

  useEffect(() => {
    setPick(Math.floor(Math.random() * ROTATING_EXAMPLES.length));
  }, []);

  return ROTATING_EXAMPLES[pick] ?? ROTATING_EXAMPLES[0];
}

type Props = {
  variant: "hero" | "inline";
  rotating: string;
  onPick: (query: string) => void;
  disabled?: boolean;
};

export function ExampleChips({
  variant,
  rotating,
  onPick,
  disabled = false,
}: Props) {
  const examples = [...FIXED_EXAMPLES, rotating];

  if (variant === "inline") {
    return (
      <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[12px] text-ink-3">
        <span className="mr-1">Try:</span>
        {examples.map((example, index) => (
          <span key={example} className="flex items-center">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(example)}
              className="inline-flex min-h-[24px] items-center rounded px-1.5 py-1 text-ink-3 underline decoration-rule-2 underline-offset-[3px] transition-colors hover:text-ink hover:decoration-ink-3 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-bg disabled:opacity-50"
            >
              {example}
            </button>
            {index < examples.length - 1 ? (
              <span aria-hidden="true" className="ml-1 text-rule-2">
                ·
              </span>
            ) : null}
          </span>
        ))}
      </div>
    );
  }

  return (
    <ul
      aria-label="Example searches"
      className="flex flex-wrap justify-center gap-2"
    >
      {examples.map((example) => (
        <li key={example}>
          <ChipButton disabled={disabled} onClick={() => onPick(example)}>
            {example}
          </ChipButton>
        </li>
      ))}
    </ul>
  );
}

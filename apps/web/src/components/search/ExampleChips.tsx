"use client";

import { useEffect, useState } from "react";
import {
  BoltIcon,
  CarIcon,
  FuelIcon,
  KeyIcon,
  ShieldIcon,
  TagIcon,
  UsersIcon,
} from "../icons";
import { ChipButton, type Tint } from "../ui/Chip";

type Example = { label: string; tint: Tint; Icon: (p: { className?: string }) => React.ReactNode };

export const EXAMPLES: readonly Example[] = [
  { label: "Show SUVs under ₹15L", tint: "lavender", Icon: CarIcon },
  { label: "Diesel automatic cars below 80k km", tint: "purple", Icon: FuelIcon },
  { label: "Family cars with high safety ratings", tint: "yellow", Icon: ShieldIcon },
  { label: "EV with 400 km range", tint: "cyan", Icon: BoltIcon },
  { label: "7 seater under 12 lakh, not diesel", tint: "orange", Icon: UsersIcon },
  { label: "Cheapest automatic hatchback in Bengaluru", tint: "green", Icon: TagIcon },
  { label: "First owner petrol sedan in Mumbai", tint: "blue", Icon: KeyIcon },
];

export const FIXED_EXAMPLES = EXAMPLES.slice(0, 3).map((e) => e.label);

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

export function ExampleChips({ variant, rotating, onPick, disabled = false }: Props) {
  if (variant === "inline") {
    const examples = [...FIXED_EXAMPLES, rotating];
    return (
      <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[12px] text-muted">
        <span className="mr-1">Try:</span>
        {examples.map((example, index) => (
          <span key={example} className="flex items-center">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(example)}
              className="inline-flex min-h-[24px] items-center rounded px-1.5 py-1 text-muted underline decoration-line underline-offset-[3px] transition-colors hover:text-primary hover:decoration-primary-line focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary-line disabled:opacity-50"
            >
              {example}
            </button>
            {index < examples.length - 1 ? (
              <span aria-hidden="true" className="ml-1 text-faint">
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
      className="flex flex-wrap justify-center gap-2.5"
    >
      {EXAMPLES.map(({ label, tint, Icon }) => (
        <li key={label}>
          <ChipButton
            tint={tint}
            icon={<Icon />}
            disabled={disabled}
            onClick={() => onPick(label)}
            className="min-h-11 px-4 text-[13.5px]"
          >
            {label}
          </ChipButton>
        </li>
      ))}
    </ul>
  );
}

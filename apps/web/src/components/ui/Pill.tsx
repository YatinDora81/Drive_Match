import { SOFT, type Tone } from "../../lib/tones";

type Props = {
  tone?: Tone | "neutral";
  mono?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function Pill({ tone = "neutral", mono = false, children, className = "" }: Props) {
  const look = tone === "neutral" ? "bg-sunk text-ink-2" : SOFT[tone];
  // Exactly one size and weight per variant, so the two never fight in the cascade.
  const type = mono ? "font-mono text-[11px] font-medium" : "text-[11.5px] font-bold";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 leading-none ${type} ${look} ${className}`}
    >
      {children}
    </span>
  );
}

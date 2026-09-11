type Tone = "neutral" | "ok" | "warn" | "err" | "accent";

const TONES: Record<Tone, string> = {
  neutral: "bg-paper-3 text-ink-2",
  ok: "bg-ok-bg text-ok",
  warn: "bg-warn-bg text-warn",
  err: "bg-err-bg text-err",
  accent: "bg-accent-bg text-accent",
};

type Props = {
  tone?: Tone;
  mono?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function Pill({
  tone = "neutral",
  mono = false,
  children,
  className = "",
}: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-[9px] py-[3px] text-[11px] font-medium leading-[1.4] ${
        mono ? "font-mono text-[10.5px]" : ""
      } ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

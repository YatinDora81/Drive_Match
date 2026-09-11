import { DOT, TEXT, type Tone } from "../../lib/tones";

type Props = { tone: Tone; label: string; value: string };

export function StatTile({ tone, label, value }: Props) {
  return (
    <div className="min-w-0 rounded-tile border border-line bg-card p-4 shadow-card">
      <p className="flex min-w-0 items-center gap-1.5 text-[12.5px] font-semibold text-ink-3">
        <i aria-hidden="true" className={`block size-2 shrink-0 rounded-[3px] ${DOT[tone]}`} />
        <span className="truncate">{label}</span>
      </p>
      <p
        title={value}
        className={`mt-1.5 truncate text-[22px] leading-tight font-extrabold tracking-[-0.03em] tabular-nums ${TEXT[tone]}`}
      >
        {value}
      </p>
    </div>
  );
}

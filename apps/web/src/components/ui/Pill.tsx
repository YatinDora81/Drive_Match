import { TINT, type Tint } from "./Chip";

type Props = {
  tint?: Tint | "neutral";
  mono?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function Pill({
  tint = "neutral",
  mono = false,
  children,
  className = "",
}: Props) {
  const look =
    tint === "neutral" ? "border-line bg-surface-2 text-body" : TINT[tint];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-[11px] font-medium leading-[1.4] ${
        mono ? "font-mono text-[10.5px]" : ""
      } ${look} ${className}`}
    >
      {children}
    </span>
  );
}

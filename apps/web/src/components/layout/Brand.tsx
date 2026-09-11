import Link from "next/link";
import { CarIcon } from "../icons";

type Props = { onClick?: () => void; withTagline?: boolean };

export function Brand({ onClick, withTagline = true }: Props) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className="flex min-w-0 items-center gap-2.5 rounded-field"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-field bg-brand text-on-brand shadow-card">
        <CarIcon className="size-5" />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-[16px] font-extrabold tracking-[-0.02em] text-ink">
          Drive Match
        </span>
        {withTagline ? (
          <span className="block text-[11.5px] font-medium text-ink-3">
            Used cars, India
          </span>
        ) : null}
      </span>
    </Link>
  );
}

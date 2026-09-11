"use client";

import { SOFT } from "../../lib/tones";
import { IDEAS } from "./presets";

type Props = {
  onPick: (query: string) => void;
  limit?: number;
  center?: boolean;
  disabled?: boolean;
};

export function Ideas({ onPick, limit, center = false, disabled = false }: Props) {
  const ideas = limit === undefined ? IDEAS : IDEAS.slice(0, limit);

  return (
    <ul
      aria-label="Example searches"
      className={`flex flex-wrap gap-2 ${center ? "justify-center" : ""}`}
    >
      {ideas.map(({ query, title, tone, Icon }) => (
        <li key={query} className="min-w-0">
          <button
            type="button"
            title={query}
            disabled={disabled}
            onClick={() => onPick(query)}
            className="ease-soft inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-card py-1.5 pr-3.5 pl-1.5 text-[13.5px] font-semibold text-ink-2 shadow-card transition-[transform,border-color,color] duration-150 hover:-translate-y-px hover:border-line-2 hover:text-ink disabled:cursor-default disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:border-line disabled:hover:text-ink-2"
          >
            <span
              aria-hidden="true"
              className={`grid size-6 shrink-0 place-items-center rounded-[7px] ${SOFT[tone]}`}
            >
              <Icon className="size-3.5" />
            </span>
            <span className="truncate">{title}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

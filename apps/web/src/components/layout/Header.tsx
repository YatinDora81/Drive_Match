"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { MonitorIcon, MoonIcon, SunIcon } from "../icons";

const OPTIONS = [
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
  { value: "system", label: "System", Icon: MonitorIcon },
] as const;

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span aria-hidden="true" className="block h-[30px] w-[92px] shrink-0" />;
  }

  return (
    <div
      role="group"
      aria-label="Theme"
      className="flex shrink-0 gap-0.5 rounded-lg bg-paper-3 p-[2.5px]"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const selected = (theme ?? "system") === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={selected}
            aria-label={`${label} theme`}
            title={`${label} theme`}
            onClick={() => setTheme(value)}
            className={`grid size-[25px] place-items-center rounded-md transition-[background-color,color] duration-[160ms] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-bg ${
              selected
                ? "bg-paper text-ink shadow-[var(--shadow)]"
                : "text-ink-3 hover:text-ink-2"
            }`}
          >
            <Icon className="size-[13px]" />
          </button>
        );
      })}
    </div>
  );
}

export function Header() {
  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-3 px-5 py-3.5 md:px-8">
        <div className="min-w-0">
          <h1 className="whitespace-nowrap font-display text-[20px] font-bold leading-[1.05] tracking-[-0.035em]">
            <span className="text-ink">Drive</span>
            <span className="text-accent">Match</span>
          </h1>
          <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.11em] text-ink-3">
            AI vehicle search
          </p>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}

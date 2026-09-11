"use client";

import { useEffect, useState } from "react";

const DELAYS = ["0s", "0.16s", "0.32s"] as const;

export function LoadingLine({ className = "" }: { className?: string }) {
  const [stage, setStage] = useState<0 | 1>(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setStage(1), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-2.5 text-[13.5px] font-semibold text-ink-2 ${className}`}
    >
      <span className="flex items-center gap-1" aria-hidden="true">
        {DELAYS.map((delay) => (
          <span
            key={delay}
            style={{ animationDelay: delay }}
            className="animate-bob size-1.5 rounded-full bg-brand"
          />
        ))}
      </span>
      <span>{stage === 0 ? "Reading your words…" : "Searching the catalogue…"}</span>
    </div>
  );
}

function GhostCard() {
  return (
    <li aria-hidden="true">
      <div className="shimmer flex h-full flex-col overflow-hidden rounded-panel border border-line bg-card shadow-card">
        <div className="h-32 bg-sunk" />
        <div className="flex flex-col gap-3 p-4">
          <div className="h-6 w-2/5 rounded bg-sunk" />
          <div className="h-4 w-3/4 rounded bg-sunk" />
          <div className="h-3 w-1/2 rounded bg-sunk" />
          <div className="grid grid-cols-3 gap-2">
            <div className="h-8 rounded-field bg-sunk" />
            <div className="h-8 rounded-field bg-sunk" />
            <div className="h-8 rounded-field bg-sunk" />
          </div>
          <div className="mt-1 flex gap-1.5">
            <div className="h-5 w-16 rounded-full bg-sunk" />
            <div className="h-5 w-12 rounded-full bg-sunk" />
          </div>
        </div>
      </div>
    </li>
  );
}

export function LoadingGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="animate-fade flex flex-col gap-4">
      <LoadingLine />
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(272px,100%),1fr))] gap-4">
        {Array.from({ length: count }, (_, index) => (
          <GhostCard key={index} />
        ))}
      </ul>
    </div>
  );
}

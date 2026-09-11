"use client";

import { useEffect, useState } from "react";

const DELAYS = ["0s", "0.16s", "0.32s"];

export function LoadingLine({ className = "" }: { className?: string }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setStage(1), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className={`flex items-center gap-[9px] text-[13px] text-ink-3 ${className}`}
    >
      <span className="flex items-center gap-[3px]" aria-hidden="true">
        {DELAYS.map((delay) => (
          <span
            key={delay}
            style={{ animationDelay: delay }}
            className="animate-bob size-[5px] rounded-full bg-ink-3"
          />
        ))}
      </span>
      <span>
        {stage === 0 ? "Understanding your query…" : "Searching the catalogue…"}
      </span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <li aria-hidden="true">
      <div className="animate-pulse-slow flex h-full flex-col overflow-hidden rounded-[12px] border border-rule bg-paper">
        <div className="aspect-[4/3] border-b border-rule bg-paper-2" />
        <div className="flex flex-col gap-2.5 p-[14px]">
          <div className="h-[22px] w-[42%] rounded bg-paper-3" />
          <div className="h-[14px] w-[70%] rounded bg-paper-3" />
          <div className="h-[12px] w-[55%] rounded bg-paper-2" />
          <div className="h-[12px] w-[62%] rounded bg-paper-2" />
          <div className="mt-1 flex gap-1.5">
            <div className="h-[20px] w-[64px] rounded-full bg-paper-2" />
            <div className="h-[20px] w-[52px] rounded-full bg-paper-2" />
          </div>
        </div>
      </div>
    </li>
  );
}

export function LoadingGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="animate-fade">
      <LoadingLine className="mb-4" />
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: count }, (_, index) => (
          <SkeletonCard key={index} />
        ))}
      </ul>
    </div>
  );
}

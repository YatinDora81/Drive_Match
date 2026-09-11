"use client";

import { useEffect, useState } from "react";

export function useTypewriter(phrases: readonly string[], active: boolean): string {
  const [text, setText] = useState(phrases[0] ?? "");

  useEffect(() => {
    if (!active || phrases.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let phrase = 0;
    let index = 0;
    let deleting = false;
    let timer = 0;

    const tick = () => {
      const current = phrases[phrase] ?? "";
      if (!deleting) {
        index += 1;
        setText(current.slice(0, index));
        if (index >= current.length) {
          deleting = true;
          timer = window.setTimeout(tick, 1900);
          return;
        }
        timer = window.setTimeout(tick, 42 + Math.random() * 36);
        return;
      }
      index -= 1;
      setText(current.slice(0, index));
      if (index <= 0) {
        deleting = false;
        phrase = (phrase + 1) % phrases.length;
        timer = window.setTimeout(tick, 380);
        return;
      }
      timer = window.setTimeout(tick, 20);
    };

    timer = window.setTimeout(tick, 700);
    return () => window.clearTimeout(timer);
  }, [phrases, active]);

  return text;
}

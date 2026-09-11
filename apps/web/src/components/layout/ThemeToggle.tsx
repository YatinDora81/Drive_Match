"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "../icons";
import { IconButton } from "../ui/IconButton";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <span
        aria-hidden="true"
        className="block size-9 shrink-0 rounded-full border border-line bg-card"
      />
    );
  }

  const dark = resolvedTheme === "dark";
  const label = dark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <IconButton label={label} onClick={() => setTheme(dark ? "light" : "dark")}>
      {dark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
    </IconButton>
  );
}

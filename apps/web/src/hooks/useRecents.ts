"use client";

import { useCallback, useEffect, useState } from "react";
import { clearRecents, pushRecent, readRecents } from "../lib/recents";

export function useRecents() {
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    setRecents(readRecents());
  }, []);

  const add = useCallback((query: string) => setRecents(pushRecent(query)), []);
  const clear = useCallback(() => setRecents(clearRecents()), []);

  return { recents, add, clear };
}

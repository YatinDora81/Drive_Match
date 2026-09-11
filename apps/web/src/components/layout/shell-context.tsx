"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRecents } from "../../hooks/useRecents";

type Shell = {
  recents: string[];
  addRecent: (query: string) => void;
  clearRecents: () => void;
  sidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
};

const ShellContext = createContext<Shell | null>(null);

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const { recents, add, clear } = useRecents();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const value = useMemo<Shell>(
    () => ({
      recents,
      addRecent: add,
      clearRecents: clear,
      sidebarOpen,
      openSidebar,
      closeSidebar,
    }),
    [recents, add, clear, sidebarOpen, openSidebar, closeSidebar],
  );

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell(): Shell {
  const shell = useContext(ShellContext);
  if (!shell) throw new Error("useShell must be used inside ShellProvider");
  return shell;
}

"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import {
  CarIcon,
  CloseIcon,
  HistoryIcon,
  MenuIcon,
  PlusIcon,
  SparkIcon,
} from "../icons";
import { IconButton } from "../ui/IconButton";
import { Kbd } from "../ui/Kbd";
import { useShell } from "./shell-context";
import { ThemeToggle } from "./ThemeToggle";

const NAV_ITEM =
  "flex min-h-11 w-full items-center gap-3 rounded-button px-3 text-left text-[13.5px] text-body transition-[background-color,color] duration-[160ms] hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary-line";

function Brand() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 rounded-button focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary-line"
    >
      <span className="grid size-8 place-items-center rounded-[10px] bg-primary text-on-primary shadow-card">
        <CarIcon className="size-[18px]" />
      </span>
      <span className="text-[19px] font-bold tracking-[-0.02em] text-ink">
        Drive Match
      </span>
    </Link>
  );
}

function RecentList() {
  const { recents, clearRecents, closeSidebar } = useShell();
  const searchParams = useSearchParams();
  const current = (searchParams.get("q") ?? "").trim().toLowerCase();

  return (
    <section aria-labelledby="sidebar-recent" className="mt-6">
      <div className="mb-1 flex items-center justify-between px-3">
        <h2 id="sidebar-recent" className="text-[12px] font-semibold text-ink">
          Recent
        </h2>
        {recents.length > 0 ? (
          <button
            type="button"
            onClick={clearRecents}
            className="rounded px-1.5 py-0.5 text-[11.5px] text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary-line"
          >
            Clear
          </button>
        ) : null}
      </div>
      {recents.length === 0 ? (
        <p className="px-3 py-2 text-[12.5px] leading-[1.55] text-muted">
          Your searches will show up here.
        </p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {recents.map((query) => {
            const active = query.toLowerCase() === current;
            return (
              <li key={query}>
                <Link
                  href={`/?q=${encodeURIComponent(query)}`}
                  onClick={closeSidebar}
                  aria-current={active ? "page" : undefined}
                  title={query}
                  className={`${NAV_ITEM} ${active ? "bg-primary-soft text-primary hover:bg-primary-soft hover:text-primary" : ""}`}
                >
                  <HistoryIcon className="size-[18px] shrink-0 text-icon" />
                  <span className="min-w-0 truncate">{query}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Sidebar() {
  const { sidebarOpen, closeSidebar } = useShell();

  return (
    <aside
      aria-label="Sidebar"
      className={`fixed inset-y-0 left-0 z-[420] flex w-[288px] flex-col border-r border-sidebar-line bg-sidebar px-4 pb-4 pt-5 transition-transform duration-[220ms] lg:sticky lg:top-0 lg:z-auto lg:h-dvh lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0 shadow-sheet lg:shadow-none" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between">
        <Brand />
        <IconButton
          label="Close sidebar"
          variant="plain"
          onClick={closeSidebar}
          className="lg:hidden"
        >
          <CloseIcon className="size-4" />
        </IconButton>
      </div>

      <Link
        href="/"
        onClick={closeSidebar}
        className="mt-7 inline-flex h-11 items-center gap-2.5 self-start rounded-button bg-primary px-5 text-[14px] font-medium text-on-primary shadow-card transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary-line"
      >
        <PlusIcon className="size-4" />
        New search
      </Link>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        <Suspense fallback={null}>
          <RecentList />
        </Suspense>
      </div>

      <div className="mt-4 rounded-card border border-primary-line bg-primary-soft px-4 py-3">
        <p className="text-[12px] font-semibold text-primary">Shortcuts</p>
        <dl className="mt-2 flex flex-col gap-1.5 text-[12px] text-body">
          <div className="flex items-center justify-between gap-3">
            <dt>Focus search</dt>
            <dd>
              <Kbd>/</Kbd>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt>Search</dt>
            <dd>
              <Kbd>↵</Kbd>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt>Clear</dt>
            <dd>
              <Kbd>esc</Kbd>
            </dd>
          </div>
        </dl>
      </div>
    </aside>
  );
}

function TopBar() {
  const { openSidebar } = useShell();

  return (
    <header className="sticky top-0 z-[300] flex h-16 items-center justify-between gap-3 px-4 backdrop-blur-sm md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <IconButton
          label="Open sidebar"
          variant="plain"
          onClick={openSidebar}
          className="lg:hidden"
        >
          <MenuIcon className="size-[18px]" />
        </IconButton>
        <div className="flex min-w-0 items-center gap-2.5">
          <SparkIcon className="size-5 shrink-0 text-primary" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[13.5px] font-medium text-ink">
              AI vehicle search
            </p>
            <p className="truncate text-[11.5px] text-muted">
              Plain words in, understood filters out
            </p>
          </div>
        </div>
      </div>
      <ThemeToggle />
    </header>
  );
}

function SidebarOverlay() {
  const { sidebarOpen, closeSidebar } = useShell();
  const pathname = usePathname();

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSidebar();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sidebarOpen, closeSidebar]);

  useEffect(() => {
    closeSidebar();
  }, [pathname, closeSidebar]);

  if (!sidebarOpen) return null;
  return (
    <div
      aria-hidden="true"
      onClick={closeSidebar}
      className="animate-fade fixed inset-0 z-[410] bg-black/30 lg:hidden"
    />
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <SidebarOverlay />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <div className="flex flex-1 flex-col">{children}</div>
        <footer className="px-5 py-6 text-center text-[12.5px] text-muted">
          Copyright ©{new Date().getFullYear()}{" "}
          <span className="font-medium text-primary">Drive Match</span>. All
          rights reserved.
        </footer>
      </div>
    </div>
  );
}

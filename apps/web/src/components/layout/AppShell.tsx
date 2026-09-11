"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { SOFT } from "../../lib/tones";
import { CloseIcon, HistoryIcon, PlusIcon } from "../icons";
import { BROWSE } from "../search/presets";
import { IconButton } from "../ui/IconButton";
import { ApiStatus } from "./ApiStatus";
import { Brand } from "./Brand";
import { useShell } from "./shell-context";

const TITLE = "mb-1 px-2 text-[11.5px] font-bold text-ink-3";

const ITEM =
  "flex min-h-10 w-full items-center gap-2.5 rounded-field px-2 text-left text-[13.5px] font-semibold transition-[background-color,color] duration-150";

const itemLook = (active: boolean) =>
  active ? "bg-brand-soft text-brand" : "text-ink-2 hover:bg-sunk hover:text-ink";

const SQUARE = "grid size-7 shrink-0 place-items-center rounded-[8px] [&_svg]:size-3.5";

const hrefFor = (query: string) => `/?q=${encodeURIComponent(query)}`;

function SideLists() {
  const { recents, clearRecents, closeSidebar } = useShell();
  const searchParams = useSearchParams();
  const current = (searchParams.get("q") ?? "").trim().toLowerCase();

  return (
    <>
      <nav aria-label="Browse" className="mt-6">
        <p className={TITLE}>Browse</p>
        <ul className="flex flex-col gap-0.5">
          {BROWSE.map(({ query, title, tone, Icon }) => {
            const active = current === query.toLowerCase();
            return (
              <li key={query}>
                <Link
                  href={hrefFor(query)}
                  onClick={closeSidebar}
                  aria-current={active ? "page" : undefined}
                  className={`${ITEM} ${itemLook(active)}`}
                >
                  <span className={`${SQUARE} ${SOFT[tone]}`}>
                    <Icon />
                  </span>
                  <span className="truncate">{title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <section aria-labelledby="sidebar-recent" className="mt-6">
        <div className="flex items-center justify-between pr-1">
          <h2 id="sidebar-recent" className={TITLE}>
            Recent
          </h2>
          {recents.length > 0 ? (
            <button
              type="button"
              onClick={clearRecents}
              className="-my-2 h-9 rounded-full px-2.5 text-[11.5px] font-semibold text-ink-3 transition-colors hover:bg-sunk hover:text-ink"
            >
              Clear
            </button>
          ) : null}
        </div>
        {recents.length === 0 ? (
          <p className="px-2 py-1 text-[12.5px] leading-relaxed text-ink-3">
            Searches you run will show up here.
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {recents.map((query) => {
              const active = query.toLowerCase() === current;
              return (
                <li key={query}>
                  <Link
                    href={hrefFor(query)}
                    onClick={closeSidebar}
                    aria-current={active ? "page" : undefined}
                    title={query}
                    className={`${ITEM} ${itemLook(active)}`}
                  >
                    <span
                      className={`${SQUARE} ${active ? "bg-card text-brand" : "bg-sunk text-ink-3"}`}
                    >
                      <HistoryIcon />
                    </span>
                    <span className="min-w-0 truncate">{query}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

function Sidebar() {
  const { sidebarOpen, closeSidebar } = useShell();

  return (
    <aside
      aria-label="Sidebar"
      className={`fixed inset-y-0 left-0 z-[420] flex w-[264px] max-w-[85vw] flex-col border-r border-line bg-side px-3 pt-4 pb-3 transition-[translate,visibility] duration-300 ease-soft lg:visible lg:sticky lg:top-0 lg:z-auto lg:h-dvh lg:max-w-none lg:translate-x-0 lg:shadow-none ${
        sidebarOpen ? "visible translate-x-0 shadow-sheet" : "invisible -translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between gap-2 px-1 pb-4">
        <Brand onClick={closeSidebar} />
        <IconButton
          label="Close menu"
          variant="plain"
          size="sm"
          onClick={closeSidebar}
          className="lg:hidden"
        >
          <CloseIcon className="size-4" />
        </IconButton>
      </div>

      <Link
        href="/"
        onClick={closeSidebar}
        className="flex h-11 items-center justify-center gap-2 rounded-field bg-brand text-[13.5px] font-bold text-on-brand shadow-card transition-[filter] duration-150 hover:brightness-110"
      >
        <PlusIcon className="size-4" />
        New search
      </Link>

      <div className="scroll-thin -mx-1 min-h-0 flex-1 overflow-y-auto px-1 pb-2">
        <Suspense fallback={null}>
          <SideLists />
        </Suspense>
      </div>

      <div className="border-t border-line pt-3">
        <ApiStatus />
      </div>
    </aside>
  );
}

function Overlay() {
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
      className="animate-fade fixed inset-0 z-[410] bg-scrim lg:hidden"
    />
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <Overlay />
      <div className="flex min-w-0 flex-1 flex-col">
        {children}
        <footer className="border-t border-line px-4 py-6 text-center text-[12.5px] text-ink-3 md:px-8">
          © {new Date().getFullYear()}{" "}
          <span className="font-semibold text-ink-2">Drive Match</span>. AI search over
          synthetic used-car listings from across India.
        </footer>
      </div>
    </div>
  );
}

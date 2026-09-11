"use client";

import { MenuIcon } from "../icons";
import { IconButton } from "../ui/IconButton";
import { Brand } from "./Brand";
import { useShell } from "./shell-context";
import { ThemeToggle } from "./ThemeToggle";

export function TopBar({ children }: { children?: React.ReactNode }) {
  const { openSidebar } = useShell();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-page/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center gap-3 px-4 md:px-8">
        <IconButton label="Open menu" onClick={openSidebar} className="lg:hidden">
          <MenuIcon className="size-[17px]" />
        </IconButton>
        <div className="flex min-w-0 flex-1 items-center">
          {children ?? (
            <span className="lg:hidden">
              <Brand withTagline={false} />
            </span>
          )}
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}

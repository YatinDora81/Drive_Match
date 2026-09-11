"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { Toaster } from "sonner";
import { ShellProvider } from "../src/components/layout/shell-context";
import { isRetryable } from "../src/lib/api";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (count, error) => count < 1 && isRetryable(error),
          },
        },
      }),
  );

  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={client}>
        <ShellProvider>{children}</ShellProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            className:
              "!bg-card !text-ink !border !border-line !rounded-[12px] !shadow-lift !font-sans !text-[13px]",
          }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

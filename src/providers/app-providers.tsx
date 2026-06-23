"use client";

import { Toaster } from "sonner";
import type { ReactNode } from "react";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        {children}
        <Toaster richColors position="top-right" closeButton />
      </QueryProvider>
    </ThemeProvider>
  );
}

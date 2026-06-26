"use client";

import { Toaster } from "sonner";
import type { ReactNode } from "react";
import { NavigationHeartLoader } from "@/components/shared/navigation-heart-loader";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <NavigationHeartLoader />
        {children}
        <Toaster richColors position="top-right" closeButton />
      </QueryProvider>
    </ThemeProvider>
  );
}

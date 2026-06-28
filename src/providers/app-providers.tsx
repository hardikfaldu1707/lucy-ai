"use client";

import { Toaster } from "sonner";
import type { ReactNode } from "react";
import { NavigationHeartLoader } from "@/components/shared/navigation-heart-loader";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";
import { MotionProvider } from "./motion-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <MotionProvider>
          <NavigationHeartLoader />
          {children}
          <Toaster richColors position="top-right" closeButton />
        </MotionProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

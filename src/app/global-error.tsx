"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/shared/error-state";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error]", error);
  }, [error]);

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="flex min-h-screen items-center justify-center bg-background p-8 font-sans">
        <ErrorState
          title="Something went wrong"
          message="An unexpected error occurred. Please refresh the page."
          onRetry={reset}
        />
      </body>
    </html>
  );
}

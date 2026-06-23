"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/shared/error-state";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[root error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <ErrorState
        title="Something went wrong"
        message="An unexpected error occurred. Please refresh the page."
        onRetry={reset}
      />
    </div>
  );
}

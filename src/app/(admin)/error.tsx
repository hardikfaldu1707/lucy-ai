"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/shared/error-state";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin error]", error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <ErrorState
        title="Admin panel error"
        message="An unexpected error occurred. Please try again or refresh the page."
        onRetry={reset}
      />
    </div>
  );
}

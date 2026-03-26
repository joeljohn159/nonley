"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="bg-nonley-bg flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-nonley-error mb-2 text-4xl font-bold">
        Something went wrong
      </h1>
      <p className="text-nonley-text-muted mb-6">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="bg-nonley-accent hover:bg-nonley-accent-hover rounded-lg px-6 py-3 text-sm font-medium text-white transition-colors"
      >
        Try Again
      </button>
    </main>
  );
}

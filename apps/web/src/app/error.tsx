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
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa]">
      <h1 className="mb-2 text-[22px] font-medium text-neutral-900">
        Something went wrong
      </h1>
      <p className="mb-6 text-[14px] text-neutral-500">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-neutral-900 px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-neutral-800"
      >
        Try Again
      </button>
    </main>
  );
}

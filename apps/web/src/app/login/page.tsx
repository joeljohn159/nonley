"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <main className="bg-nonley-bg flex min-h-screen items-center justify-center">
      <div className="border-nonley-border bg-nonley-surface w-full max-w-sm rounded-2xl border p-8">
        <h1 className="text-nonley-accent mb-2 text-center text-2xl font-bold">
          nonley
        </h1>
        <p className="text-nonley-text-muted mb-8 text-center text-sm">
          You are never alone on the internet.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="border-nonley-border bg-nonley-bg text-nonley-text hover:border-nonley-accent/50 flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors"
          >
            Continue with Google
          </button>
          <button
            onClick={() => signIn("github", { callbackUrl: "/" })}
            className="border-nonley-border bg-nonley-bg text-nonley-text hover:border-nonley-accent/50 flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors"
          >
            Continue with GitHub
          </button>
          <div className="my-2 flex items-center gap-3">
            <div className="bg-nonley-border h-px flex-1" />
            <span className="text-nonley-text-muted text-xs">or</span>
            <div className="bg-nonley-border h-px flex-1" />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const email = new FormData(form).get("email") as string;
              signIn("email", { email, callbackUrl: "/" });
            }}
          >
            <input
              name="email"
              type="email"
              placeholder="Email address"
              required
              className="border-nonley-border bg-nonley-bg text-nonley-text placeholder:text-nonley-text-muted focus:border-nonley-accent mb-3 w-full rounded-lg border px-4 py-3 text-sm focus:outline-none"
            />
            <button
              type="submit"
              className="bg-nonley-accent hover:bg-nonley-accent-hover w-full rounded-lg px-4 py-3 text-sm font-medium text-white transition-colors"
            >
              Send Magic Link
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

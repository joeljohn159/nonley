"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsEmailSending(true);
    await signIn("email", { email, callbackUrl: "/" });
    setEmailSent(true);
    setIsEmailSending(false);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#060611]">
      {/* Animated gradient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 animate-[drift_20s_ease-in-out_infinite] rounded-full bg-indigo-600/[0.07] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 animate-[drift_25s_ease-in-out_infinite_reverse] rounded-full bg-violet-500/[0.05] blur-[100px]" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 animate-[drift_15s_ease-in-out_infinite] rounded-full bg-blue-500/[0.04] blur-[80px]" />
      </div>

      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 w-full max-w-[420px] px-6">
        {/* Logo & tagline */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center justify-center">
            <div className="relative">
              <div className="absolute -inset-3 rounded-full bg-indigo-500/20 blur-xl" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4" opacity="0.5" />
                </svg>
              </div>
            </div>
          </div>
          <h1 className="mb-2 text-[28px] font-semibold tracking-tight text-white">
            Welcome to Nonley
          </h1>
          <p className="text-[15px] leading-relaxed text-white/40">
            The presence layer of the internet.
            <br />
            <span className="text-white/55">You are never alone.</span>
          </p>
        </div>

        {/* Auth card */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl">
          {/* OAuth buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[14px] font-medium text-white/90 transition-all duration-200 hover:border-white/[0.15] hover:bg-white/[0.07] active:scale-[0.98]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>

            <button
              onClick={() => signIn("github", { callbackUrl: "/" })}
              className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[14px] font-medium text-white/90 transition-all duration-200 hover:border-white/[0.15] hover:bg-white/[0.07] active:scale-[0.98]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Continue with GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="my-5 flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
            <span className="text-[12px] font-medium uppercase tracking-widest text-white/25">
              or
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailSubmit}>
            <div className="relative">
              <input
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                required
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[14px] text-white transition-all duration-200 placeholder:text-white/20 focus:border-indigo-500/50 focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-indigo-500/25"
              />
            </div>
            <button
              type="submit"
              disabled={isEmailSending}
              className="mt-3 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-3 text-[14px] font-medium text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:shadow-indigo-500/30 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isEmailSending ? (
                <span className="inline-flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="opacity-25"
                    />
                    <path
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      fill="currentColor"
                      className="opacity-75"
                    />
                  </svg>
                  Sending...
                </span>
              ) : emailSent ? (
                "Check your inbox"
              ) : (
                "Continue with Email"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-[12px] leading-relaxed text-white/20">
          By continuing, you agree to our{" "}
          <a
            href="/terms"
            className="text-white/35 underline decoration-white/10 underline-offset-2 transition-colors hover:text-white/50"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            className="text-white/35 underline decoration-white/10 underline-offset-2 transition-colors hover:text-white/50"
          >
            Privacy Policy
          </a>
        </p>
      </div>
    </main>
  );
}

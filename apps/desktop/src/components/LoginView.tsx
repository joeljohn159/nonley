/**
 * Login screen.
 * Opens the web login in the system browser and accepts a pasted auth token.
 */

import { useState, useCallback } from "react";

import { openLoginUrl } from "../lib/tauri";
import { useAuthStore } from "../stores/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function LoginView() {
  const [token, setToken] = useState("");
  const [showTokenInput, setShowTokenInput] = useState(false);
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);

  const handleOpenLogin = useCallback(async () => {
    try {
      await openLoginUrl(`${API_URL}/auth/desktop`);
      setShowTokenInput(true);
    } catch {
      // If the desktop auth route doesn't exist, open main login
      await openLoginUrl(`${API_URL}/auth/signin`);
      setShowTokenInput(true);
    }
  }, []);

  const handleSubmitToken = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = token.trim();
      if (!trimmed) return;
      await login(trimmed);
    },
    [token, login],
  );

  return (
    <div className="flex h-full flex-col items-center justify-center px-8">
      <div className="mb-8 text-center">
        <div className="bg-nonley-primary mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
          <span className="text-2xl font-bold text-white">N</span>
        </div>
        <h1 className="text-nonley-text mb-1 text-xl font-semibold">
          Welcome to Nonley
        </h1>
        <p className="text-nonley-muted text-sm">
          See who&apos;s using the same apps as you
        </p>
      </div>

      {!showTokenInput ? (
        <button
          onClick={handleOpenLogin}
          className="bg-nonley-primary hover:bg-nonley-primary/90 active:bg-nonley-primary/80 w-full max-w-xs rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors"
        >
          Sign in with Nonley
        </button>
      ) : (
        <form onSubmit={handleSubmitToken} className="w-full max-w-xs">
          <p className="text-nonley-muted mb-3 text-center text-xs">
            After signing in on the web, paste your auth token below.
          </p>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste your auth token..."
            className="border-nonley-border bg-nonley-surface text-nonley-text placeholder-nonley-muted focus:border-nonley-primary mb-3 w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors"
            autoFocus
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !token.trim()}
            className="bg-nonley-primary hover:bg-nonley-primary/90 w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Continue"}
          </button>
          {error && (
            <p className="text-nonley-danger mt-2 text-center text-xs">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={() => setShowTokenInput(false)}
            className="text-nonley-muted hover:text-nonley-text mt-2 w-full text-center text-xs transition-colors"
          >
            Back
          </button>
        </form>
      )}

      <p className="text-nonley-muted mt-8 text-center text-[10px]">
        Nonley never stores passwords.
        <br />
        Auth is magic link or OAuth only.
      </p>
    </div>
  );
}

export default LoginView;

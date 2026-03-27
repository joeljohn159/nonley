/**
 * Settings panel.
 * Provides controls for privacy level, focus mode, auto-start, and logout.
 */

import type { PrivacyLevel } from "@nonley/types";
import { useState, useEffect, useCallback } from "react";

import { getSettings, updateSettings } from "../lib/api";
import { setAutostart } from "../lib/tauri";
import { useAuthStore } from "../stores/auth";
import { usePresenceStore } from "../stores/presence";

import Avatar from "./Avatar";

interface SettingsProps {
  toggleFocus: (enabled: boolean) => void;
}

const privacyOptions: Array<{
  value: PrivacyLevel;
  label: string;
  description: string;
}> = [
  {
    value: "open",
    label: "Open",
    description: "Everyone can see you",
  },
  {
    value: "circles_only",
    label: "Circles Only",
    description: "Only your circles can see you",
  },
  {
    value: "anonymous",
    label: "Anonymous",
    description: "Visible but without your name",
  },
  {
    value: "ghost",
    label: "Ghost",
    description: "Completely invisible to others",
  },
];

function Settings({ toggleFocus }: SettingsProps) {
  const user = useAuthStore((s) => s.user);
  const authToken = useAuthStore((s) => s.authToken);
  const logout = useAuthStore((s) => s.logout);
  const focusMode = usePresenceStore((s) => s.focusMode);
  const setFocusMode = usePresenceStore((s) => s.setFocusMode);

  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>(
    user?.privacyDefault ?? "open",
  );
  const [autoStartEnabled, setAutoStartEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load settings
  useEffect(() => {
    if (!authToken) return;

    getSettings(authToken).then((response) => {
      if (response.success && response.data) {
        setPrivacyLevel(response.data.privacyDefault);
        setFocusMode(response.data.focusMode);
      }
    });
  }, [authToken, setFocusMode]);

  const handlePrivacyChange = useCallback(
    async (level: PrivacyLevel) => {
      if (!authToken) return;
      setPrivacyLevel(level);
      setSaving(true);
      try {
        await updateSettings(authToken, { privacyDefault: level });
      } catch {
        // Revert on error
        setPrivacyLevel(privacyLevel);
      } finally {
        setSaving(false);
      }
    },
    [authToken, privacyLevel],
  );

  const handleFocusToggle = useCallback(async () => {
    const newValue = !focusMode;
    setFocusMode(newValue);
    toggleFocus(newValue);

    if (authToken) {
      try {
        await updateSettings(authToken, { focusMode: newValue });
      } catch {
        // Revert on error
        setFocusMode(!newValue);
        toggleFocus(!newValue);
      }
    }
  }, [focusMode, authToken, setFocusMode, toggleFocus]);

  const handleAutoStartToggle = useCallback(async () => {
    const newValue = !autoStartEnabled;
    try {
      await setAutostart(newValue);
      setAutoStartEnabled(newValue);
    } catch {
      // Failed to change autostart setting
    }
  }, [autoStartEnabled]);

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-nonley-border border-b px-3 py-2">
        <h2 className="text-nonley-text text-sm font-medium">Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* User profile */}
        {user && (
          <div className="border-nonley-border border-b p-4">
            <div className="flex items-center gap-3">
              <Avatar name={user.name} avatarUrl={user.avatarUrl} size="lg" />
              <div className="min-w-0">
                <p className="text-nonley-text truncate text-sm font-medium">
                  {user.name ?? "Anonymous"}
                </p>
                <p className="text-nonley-muted truncate text-xs">
                  {user.email}
                </p>
                <span className="bg-nonley-primary/20 text-nonley-primary mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium">
                  {user.plan.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Privacy level */}
        <div className="border-nonley-border border-b p-4">
          <h3 className="text-nonley-muted mb-2 text-xs font-medium uppercase tracking-wider">
            Default Privacy
          </h3>
          <div className="space-y-1">
            {privacyOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handlePrivacyChange(option.value)}
                disabled={saving}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
                  privacyLevel === option.value
                    ? "bg-nonley-primary/10 ring-nonley-primary ring-1"
                    : "hover:bg-nonley-surface-elevated"
                }`}
              >
                <div
                  className={`h-3 w-3 rounded-full border-2 ${
                    privacyLevel === option.value
                      ? "border-nonley-primary bg-nonley-primary"
                      : "border-nonley-border"
                  }`}
                />
                <div>
                  <p className="text-nonley-text text-sm">{option.label}</p>
                  <p className="text-nonley-muted text-[10px]">
                    {option.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Focus mode */}
        <div className="border-nonley-border border-b p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-nonley-text text-sm">Focus Mode</h3>
              <p className="text-nonley-muted text-[10px]">
                Hide all presence while focusing
              </p>
            </div>
            <button
              onClick={handleFocusToggle}
              className={`relative h-5 w-9 rounded-full transition-colors ${
                focusMode ? "bg-nonley-primary" : "bg-nonley-border"
              }`}
              role="switch"
              aria-checked={focusMode}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                  focusMode ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Auto-start */}
        <div className="border-nonley-border border-b p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-nonley-text text-sm">Launch at Login</h3>
              <p className="text-nonley-muted text-[10px]">
                Start Nonley when you log in
              </p>
            </div>
            <button
              onClick={handleAutoStartToggle}
              className={`relative h-5 w-9 rounded-full transition-colors ${
                autoStartEnabled ? "bg-nonley-primary" : "bg-nonley-border"
              }`}
              role="switch"
              aria-checked={autoStartEnabled}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                  autoStartEnabled ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="border-nonley-danger/30 bg-nonley-danger/10 text-nonley-danger hover:bg-nonley-danger/20 w-full rounded-lg border px-4 py-2 text-sm transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;

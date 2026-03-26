"use client";

import type { PrivacyLevel } from "@nonley/types";
import { useState, useEffect } from "react";

interface SettingsUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface UserSettings {
  privacyDefault: string;
  focusMode: boolean;
  plan: string;
  integrations: Array<{ provider: string; connectedAt: string }>;
}

export function SettingsForm({ user }: { user: SettingsUser }) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((res) => {
        if (res.data) {
          setSettings({
            privacyDefault: res.data.privacyDefault,
            focusMode: res.data.focusMode,
            plan: res.data.plan,
            integrations: res.data.integrations ?? [],
          });
        }
      })
      .catch(console.error);
  }, []);

  async function saveSettings(update: Partial<UserSettings>) {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      setSettings((s) => (s ? { ...s, ...update } : s));
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/settings/export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "nonley-export.json";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    await fetch("/api/settings/delete-account", { method: "DELETE" });
    window.location.href = "/login";
  }

  const privacy = (settings?.privacyDefault ?? "circles_only") as PrivacyLevel;
  const focusMode = settings?.focusMode ?? false;

  return (
    <div className="space-y-8">
      {/* Profile */}
      <section className="border-nonley-border bg-nonley-surface rounded-xl border p-6">
        <h3 className="text-nonley-text-muted mb-4 text-sm font-semibold uppercase tracking-wider">
          Profile
        </h3>
        <div className="flex items-center gap-4">
          {user.image && (
            <img
              src={user.image}
              alt={user.name ?? "Avatar"}
              className="h-16 w-16 rounded-full"
            />
          )}
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-nonley-text-muted text-sm">{user.email}</p>
            {settings && (
              <span className="bg-nonley-accent/20 text-nonley-accent mt-1 inline-block rounded-full px-2 py-0.5 text-xs">
                {settings.plan} plan
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="border-nonley-border bg-nonley-surface rounded-xl border p-6">
        <h3 className="text-nonley-text-muted mb-4 text-sm font-semibold uppercase tracking-wider">
          Privacy
        </h3>
        <label htmlFor="privacy-select" className="mb-2 block text-sm">
          Default Visibility
        </label>
        <select
          id="privacy-select"
          value={privacy}
          onChange={(e) => saveSettings({ privacyDefault: e.target.value })}
          disabled={saving}
          className="border-nonley-border bg-nonley-bg text-nonley-text focus:border-nonley-accent w-full rounded-lg border px-4 py-2 text-sm focus:outline-none disabled:opacity-50"
        >
          <option value="open">Open - Everyone can see you</option>
          <option value="circles_only">
            Circles Only - Only circle members see you
          </option>
          <option value="anonymous">
            Anonymous - Counted but not identified
          </option>
          <option value="ghost">Ghost - Completely invisible</option>
        </select>
      </section>

      {/* Focus Mode */}
      <section className="border-nonley-border bg-nonley-surface rounded-xl border p-6">
        <h3 className="text-nonley-text-muted mb-4 text-sm font-semibold uppercase tracking-wider">
          Focus Mode
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Focus Mode</p>
            <p className="text-nonley-text-muted text-xs">
              Hides all Nonley UI. You&apos;re still counted in rooms.
            </p>
          </div>
          <button
            role="switch"
            aria-checked={focusMode}
            aria-label="Toggle focus mode"
            onClick={() => saveSettings({ focusMode: !focusMode })}
            disabled={saving}
            className={`relative h-6 w-11 rounded-full transition-colors ${focusMode ? "bg-nonley-accent" : "bg-nonley-border"}`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${focusMode ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
        </div>
      </section>

      {/* Integrations */}
      <section className="border-nonley-border bg-nonley-surface rounded-xl border p-6">
        <h3 className="text-nonley-text-muted mb-4 text-sm font-semibold uppercase tracking-wider">
          Integrations
        </h3>
        <div className="space-y-3">
          {["Spotify", "Steam", "GitHub", "Strava", "Goodreads"].map((name) => {
            const connected = settings?.integrations.some(
              (i) => i.provider.toLowerCase() === name.toLowerCase(),
            );
            return (
              <div key={name} className="flex items-center justify-between">
                <span className="text-sm">{name}</span>
                <button
                  className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                    connected
                      ? "border-nonley-success/30 text-nonley-success"
                      : "border-nonley-border text-nonley-text-muted hover:border-nonley-accent/50 hover:text-nonley-text"
                  }`}
                >
                  {connected ? "Connected" : "Connect"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Account */}
      <section className="bg-nonley-surface rounded-xl border border-red-900/50 p-6">
        <h3 className="text-nonley-error mb-4 text-sm font-semibold uppercase tracking-wider">
          Account
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Export Data</p>
            <p className="text-nonley-text-muted text-xs">
              Download all your data in JSON format
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="border-nonley-border text-nonley-text-muted hover:border-nonley-accent/50 rounded-lg border px-3 py-1.5 text-xs transition-colors disabled:opacity-50"
          >
            {exporting ? "Exporting..." : "Export"}
          </button>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-nonley-error text-sm font-medium">
              Delete Account
            </p>
            <p className="text-nonley-text-muted text-xs">
              Permanently delete your account and all data
            </p>
          </div>
          <button
            onClick={handleDelete}
            className="text-nonley-error rounded-lg border border-red-900/50 px-3 py-1.5 text-xs transition-colors hover:bg-red-900/20"
          >
            {deleteConfirm ? "Confirm Delete" : "Delete"}
          </button>
        </div>
      </section>
    </div>
  );
}

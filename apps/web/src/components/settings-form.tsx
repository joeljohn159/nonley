"use client";

import type { PrivacyLevel } from "@nonley/types";
import { useState, useEffect, useRef } from "react";

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
    <div className="space-y-6">
      {/* Profile */}
      <section className="rounded-xl border border-neutral-200 bg-white p-5">
        <h3 className="mb-4 text-[12px] font-medium uppercase tracking-wider text-neutral-400">
          Profile
        </h3>
        <div className="flex items-center gap-4">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name ?? "Avatar"}
              className="h-12 w-12 rounded-full"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-[14px] font-medium text-neutral-500">
              {(user.name ?? user.email ?? "?")[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-[14px] font-medium text-neutral-800">
              {user.name}
            </p>
            <p className="text-[13px] text-neutral-400">{user.email}</p>
            {settings && (
              <span className="mt-1 inline-block rounded bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500">
                {settings.plan}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Privacy */}
      <PrivacyDropdown
        value={privacy}
        onChange={(val) => saveSettings({ privacyDefault: val })}
        disabled={saving}
      />

      {/* Focus Mode */}
      <section className="rounded-xl border border-neutral-200 bg-white p-5">
        <h3 className="mb-4 text-[12px] font-medium uppercase tracking-wider text-neutral-400">
          Focus Mode
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-neutral-700">
              Focus Mode
            </p>
            <p className="text-[12px] text-neutral-400">
              Hides all Nonley UI. You&apos;re still counted in rooms.
            </p>
          </div>
          <button
            role="switch"
            aria-checked={focusMode}
            aria-label="Toggle focus mode"
            onClick={() => saveSettings({ focusMode: !focusMode })}
            disabled={saving}
            className={`relative h-5 w-9 rounded-full transition-colors ${focusMode ? "bg-neutral-900" : "bg-neutral-200"}`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${focusMode ? "translate-x-4" : "translate-x-0"}`}
            />
          </button>
        </div>
      </section>

      {/* Integrations */}
      <section className="rounded-xl border border-neutral-200 bg-white p-5">
        <h3 className="mb-4 text-[12px] font-medium uppercase tracking-wider text-neutral-400">
          Integrations
        </h3>
        <div className="space-y-3">
          {["Spotify", "Steam", "GitHub", "Strava", "Goodreads"].map((name) => {
            const connected = settings?.integrations.some(
              (i) => i.provider.toLowerCase() === name.toLowerCase(),
            );
            return (
              <div key={name} className="flex items-center justify-between">
                <span className="text-[13px] text-neutral-700">{name}</span>
                <button
                  className={`rounded-md border px-3 py-1 text-[12px] transition-colors ${
                    connected
                      ? "border-emerald-200 text-emerald-600"
                      : "border-neutral-200 text-neutral-400 hover:border-neutral-300 hover:text-neutral-600"
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
      <section className="rounded-xl border border-red-200 bg-white p-5">
        <h3 className="mb-4 text-[12px] font-medium uppercase tracking-wider text-red-400">
          Account
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-neutral-700">
              Export Data
            </p>
            <p className="text-[12px] text-neutral-400">
              Download all your data in JSON format
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="rounded-md border border-neutral-200 px-3 py-1 text-[12px] text-neutral-400 transition-colors hover:border-neutral-300 hover:text-neutral-600 disabled:opacity-40"
          >
            {exporting ? "Exporting..." : "Export"}
          </button>
        </div>
        <div className="mt-4 border-t border-neutral-100 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-red-500">
                Delete Account
              </p>
              <p className="text-[12px] text-neutral-400">
                Permanently delete your account and all data
              </p>
            </div>
            <button
              onClick={handleDelete}
              className="rounded-md border border-red-200 px-3 py-1 text-[12px] text-red-500 transition-colors hover:bg-red-50"
            >
              {deleteConfirm ? "Confirm Delete" : "Delete"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

const PRIVACY_OPTIONS = [
  { value: "open", label: "Open", desc: "Everyone can see you" },
  {
    value: "circles_only",
    label: "Circles Only",
    desc: "Only circle members see you",
  },
  {
    value: "anonymous",
    label: "Anonymous",
    desc: "Counted but not identified",
  },
  { value: "ghost", label: "Ghost", desc: "Completely invisible" },
];

function PrivacyDropdown({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected =
    PRIVACY_OPTIONS.find((o) => o.value === value) ?? PRIVACY_OPTIONS[1];

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5">
      <h3 className="mb-4 text-[12px] font-medium uppercase tracking-wider text-neutral-400">
        Privacy
      </h3>
      <p className="mb-1.5 text-[13px] text-neutral-500">Default Visibility</p>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setOpen(!open)}
          disabled={disabled}
          className="flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-left text-[13px] text-neutral-700 transition-colors hover:border-neutral-300 focus:border-neutral-400 focus:outline-none disabled:opacity-40"
        >
          <span>
            {selected?.label} - {selected?.desc}
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className={`shrink-0 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path
              d="M4 6l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {open && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
            {PRIVACY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] transition-colors hover:bg-neutral-50 ${
                  opt.value === value
                    ? "bg-neutral-50 text-neutral-900"
                    : "text-neutral-600"
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    opt.value === value
                      ? "border-neutral-900 bg-neutral-900"
                      : "border-neutral-300"
                  }`}
                >
                  {opt.value === value && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </span>
                <span>
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-neutral-400"> - {opt.desc}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

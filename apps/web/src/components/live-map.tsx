"use client";

import { PresenceClient } from "@nonley/presence-client";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

import { usePresenceStore } from "@/stores/presence";

export function LiveMap() {
  const rooms = usePresenceStore((s) => s.activeRooms);
  const updateRoom = usePresenceStore((s) => s.updateRoom);
  const [status, setStatus] = useState<"connecting" | "connected" | "error">(
    "connecting",
  );

  const initPresence = useCallback(async () => {
    try {
      const res = await fetch("/api/ws-token", { method: "POST" });
      const json = await res.json();
      if (!json.data?.token) {
        setStatus("error");
        return;
      }

      const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001";
      const client = new PresenceClient({
        url: wsUrl,
        token: json.data.token,
        onPresenceUpdate: (room) => updateRoom(room),
        onConnect: () => setStatus("connected"),
        onDisconnect: () => setStatus("connecting"),
      });
      client.connect();
      return client;
    } catch (err) {
      console.error("Failed to init presence:", err);
      setStatus("error");
    }
  }, [updateRoom]);

  useEffect(() => {
    let client: PresenceClient | undefined;
    initPresence().then((c) => {
      client = c;
    });
    return () => {
      client?.disconnect();
    };
  }, [initPresence]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-[18px] font-medium text-neutral-900">
          Your Network, Live
        </h2>
        <span className="flex items-center gap-2 text-[12px] text-neutral-400">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              status === "connected"
                ? "bg-emerald-500"
                : status === "error"
                  ? "bg-red-400"
                  : "animate-pulse bg-amber-400"
            }`}
          />
          {status === "connected"
            ? "Connected"
            : status === "error"
              ? "Disconnected"
              : "Connecting..."}
        </span>
      </div>

      {rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-200 bg-white py-16 text-center">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-neutral-400"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <p className="text-[15px] font-medium text-neutral-700">
            No one online yet
          </p>
          <p className="mt-1.5 max-w-xs text-[13px] text-neutral-400">
            Your live map will populate as your network comes online. Use the
            Chrome extension to see who&apos;s browsing with you.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/chat"
              className="rounded-lg bg-neutral-900 px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-85"
            >
              Go to Chat
            </Link>
            <Link
              href="/discover"
              className="rounded-lg border border-neutral-200 px-4 py-2 text-[13px] font-medium text-neutral-600 transition-colors hover:border-neutral-300"
            >
              Discover
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {rooms.map((room) => (
            <div
              key={room.roomHash}
              className="rounded-xl border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[13px] font-medium text-neutral-800">
                  {room.totalCount} online
                </span>
              </div>
              {room.ring1.length > 0 && (
                <p className="mb-2 text-[12px] text-neutral-400">
                  {room.ring1.length} friends
                </p>
              )}
              <p className="truncate font-mono text-[11px] text-neutral-400">
                {room.roomHash.slice(0, 16)}...
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

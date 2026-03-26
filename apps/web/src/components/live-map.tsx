"use client";

import { PresenceClient } from "@nonley/presence-client";
import { useEffect, useState, useCallback } from "react";

import { usePresenceStore } from "@/stores/presence";

export function LiveMap() {
  const rooms = usePresenceStore((s) => s.activeRooms);
  const updateRoom = usePresenceStore((s) => s.updateRoom);
  const [connected, setConnected] = useState(false);

  const initPresence = useCallback(async () => {
    try {
      const res = await fetch("/api/ws-token", { method: "POST" });
      const { data } = await res.json();
      if (!data?.token) return;

      const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001";
      const client = new PresenceClient({
        url: wsUrl,
        token: data.token,
        onPresenceUpdate: (room) => updateRoom(room),
        onConnect: () => setConnected(true),
        onDisconnect: () => setConnected(false),
      });
      client.connect();
      return client;
    } catch (err) {
      console.error("Failed to init presence:", err);
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
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Your Network, Live</h2>
        <span
          className={`flex items-center gap-2 text-xs ${connected ? "text-nonley-success" : "text-nonley-text-muted"}`}
        >
          <span
            className={`h-2 w-2 rounded-full ${connected ? "bg-nonley-success" : "bg-nonley-border"}`}
          />
          {connected ? "Connected" : "Connecting..."}
        </span>
      </div>
      {rooms.length === 0 ? (
        <div className="border-nonley-border bg-nonley-surface/50 flex flex-col items-center justify-center rounded-2xl border py-24 text-center">
          <div className="mb-4 text-6xl opacity-20">&#x1F310;</div>
          <p className="text-nonley-text-muted text-lg">
            Your live map will populate as your network comes online.
          </p>
          <p className="text-nonley-text-muted mt-2 text-sm">
            Install the Chrome extension to start seeing who&apos;s browsing
            with you.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {rooms.map((room) => (
            <div
              key={room.roomHash}
              className="border-nonley-border bg-nonley-surface hover:border-nonley-accent/30 hover:shadow-nonley-accent/5 rounded-xl border p-4 transition-all hover:shadow-lg"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="bg-nonley-success h-2 w-2 rounded-full" />
                <span className="text-sm font-medium">
                  {room.totalCount} online
                </span>
              </div>
              {room.ring1.length > 0 && (
                <div className="mb-2">
                  <span className="text-nonley-text-muted text-xs">
                    {room.ring1.length} friends
                  </span>
                </div>
              )}
              <p className="text-nonley-text-muted truncate font-mono text-xs">
                {room.roomHash.slice(0, 16)}...
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

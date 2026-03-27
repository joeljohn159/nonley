"use client";

import { useState, useEffect, useRef } from "react";

interface FriendData {
  friendshipId: string;
  userId: string;
  name: string | null;
  avatarUrl: string | null;
  online: boolean;
  createdAt: string;
}

interface FriendRequestData {
  id: string;
  fromId: string;
  toId: string;
  status: string;
  createdAt: string;
  from?: { id: string; name: string | null; avatarUrl: string | null };
  to?: { id: string; name: string | null; avatarUrl: string | null };
}

interface MessageData {
  id: string;
  friendshipId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  createdAt: string;
}

type Tab = "friends" | "requests" | "chat";

export default function FriendsPage() {
  const [tab, setTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [requests, setRequests] = useState<{
    received: FriendRequestData[];
    sent: FriendRequestData[];
  }>({ received: [], sent: [] });
  const [activeFriend, setActiveFriend] = useState<FriendData | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [callState, setCallState] = useState<
    "idle" | "calling" | "ringing" | "active"
  >("idle");
  const [callType, setCallType] = useState<"audio" | "video">("audio");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    loadFriends();
    loadRequests();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadFriends() {
    try {
      const res = await fetch("/api/friends");
      const json = await res.json();
      if (json.data) setFriends(json.data);
    } catch (err) {
      console.error("Failed to load friends:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadRequests() {
    try {
      const res = await fetch("/api/friends/requests");
      const json = await res.json();
      if (json.data) setRequests(json.data);
    } catch (err) {
      console.error("Failed to load requests:", err);
    }
  }

  async function handleAcceptRequest(requestId: string) {
    await fetch(`/api/friends/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept" }),
    });
    loadFriends();
    loadRequests();
  }

  async function handleDeclineRequest(requestId: string) {
    await fetch(`/api/friends/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "decline" }),
    });
    loadRequests();
  }

  async function handleRemoveFriend(friendshipId: string) {
    await fetch(`/api/friends/${friendshipId}`, { method: "DELETE" });
    setFriends((f) => f.filter((fr) => fr.friendshipId !== friendshipId));
    if (activeFriend?.friendshipId === friendshipId) {
      setActiveFriend(null);
      setTab("friends");
    }
  }

  async function openChat(friend: FriendData) {
    setActiveFriend(friend);
    setTab("chat");
    setMessages([]);
    try {
      const res = await fetch(`/api/friends/${friend.friendshipId}/messages`);
      const json = await res.json();
      if (json.data?.messages) {
        setMessages(json.data.messages.reverse());
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!msgInput.trim() || !activeFriend) return;

    const content = msgInput.trim();
    setMsgInput("");

    // Optimistic update
    const tempMsg: MessageData = {
      id: crypto.randomUUID(),
      friendshipId: activeFriend.friendshipId,
      senderId: "me",
      senderName: "You",
      senderAvatar: "",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      await fetch(`/api/friends/${activeFriend.friendshipId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
    } catch {
      // Message will be synced via WebSocket
    }
  }

  async function handleSendRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!searchEmail.trim()) return;
    setSearchResult(null);

    try {
      // Look up user by email
      const lookupRes = await fetch(
        `/api/friends/lookup?email=${encodeURIComponent(searchEmail.trim())}`,
      );
      const lookupJson = await lookupRes.json();
      if (!lookupJson.data?.userId) {
        setSearchResult("User not found");
        return;
      }

      // Send friend request
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: lookupJson.data.userId }),
      });
      const json = await res.json();
      if (json.error) {
        setSearchResult(json.error);
      } else {
        setSearchResult("Friend request sent!");
        setSearchEmail("");
        loadRequests();
      }
    } catch {
      setSearchResult("Failed to send request");
    }
  }

  function startCall(friend: FriendData, type: "audio" | "video") {
    setCallType(type);
    setCallState("calling");
    setActiveFriend(friend);
    // WebRTC setup would connect via the presence engine signaling
    // For now, show the call UI
  }

  function endCall() {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    setCallState("idle");
  }

  return (
    <main className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-neutral-900">Friends</h1>
          <p className="text-sm text-neutral-500">
            Connect and chat with people you meet while browsing.
          </p>
        </div>

        {/* Call Overlay */}
        {callState !== "idle" && activeFriend && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="flex flex-col items-center gap-6 rounded-2xl bg-neutral-900 p-10 text-center">
              {callType === "video" && (
                <div className="relative mb-4 h-64 w-96 overflow-hidden rounded-xl bg-neutral-800">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="h-full w-full object-cover"
                  />
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute bottom-3 right-3 h-24 w-32 rounded-lg border-2 border-neutral-700 object-cover"
                  />
                </div>
              )}
              {callType === "audio" && (
                <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-800">
                  {activeFriend.avatarUrl ? (
                    <img
                      src={activeFriend.avatarUrl}
                      alt=""
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl text-neutral-400">
                      {(activeFriend.name ?? "?")[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
              )}
              <p className="text-lg font-medium text-white">
                {activeFriend.name ?? "Anonymous"}
              </p>
              <p className="text-sm text-neutral-400">
                {callState === "calling"
                  ? "Calling..."
                  : callState === "ringing"
                    ? "Ringing..."
                    : callType === "video"
                      ? "Video Call"
                      : "Voice Call"}
              </p>

              {callState === "active" && (
                <div className="flex gap-3">
                  <button
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 text-white transition-colors hover:bg-neutral-600"
                    title="Mute"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" x2="12" y1="19" y2="22" />
                    </svg>
                  </button>
                  {callType === "video" && (
                    <button
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 text-white transition-colors hover:bg-neutral-600"
                      title="Toggle Camera"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
                        <rect x="2" y="6" width="14" height="12" rx="2" />
                      </svg>
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={endCall}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 2.59 3.4Z" />
                  <line x1="2" x2="22" y1="2" y2="22" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Add Friend */}
        <form
          onSubmit={handleSendRequest}
          className="mb-6 rounded-xl border border-neutral-200 bg-white p-4"
        >
          <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-neutral-400">
            Add Friend by Email
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="testuser2@test.com"
              className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-[13px] text-neutral-800 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!searchEmail.trim()}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-30"
            >
              Send Request
            </button>
          </div>
          {searchResult && (
            <p
              className={`mt-2 text-[12px] ${searchResult.includes("sent") ? "text-emerald-600" : "text-red-500"}`}
            >
              {searchResult}
            </p>
          )}
        </form>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-lg bg-neutral-100 p-1">
          {[
            { key: "friends" as const, label: "My Friends" },
            {
              key: "requests" as const,
              label: `Requests${requests.received.length > 0 ? ` (${requests.received.length})` : ""}`,
            },
            { key: "chat" as const, label: "Chat" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
                tab === t.key
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="rounded-xl border border-neutral-200 bg-white">
          {tab === "friends" && (
            <div className="divide-y divide-neutral-100">
              {loading ? (
                <div className="p-8 text-center text-sm text-neutral-400">
                  Loading...
                </div>
              ) : friends.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm font-medium text-neutral-700">
                    No friends yet
                  </p>
                  <p className="mt-1 text-xs text-neutral-400">
                    Use the extension to send friend requests to people you meet
                    on the same page.
                  </p>
                </div>
              ) : (
                friends.map((friend) => (
                  <div
                    key={friend.friendshipId}
                    className="flex items-center justify-between px-5 py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {friend.avatarUrl ? (
                          <img
                            src={friend.avatarUrl}
                            alt=""
                            className="h-9 w-9 rounded-full"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-sm font-medium text-neutral-500">
                            {(friend.name ?? "?")[0]?.toUpperCase()}
                          </div>
                        )}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${friend.online ? "bg-emerald-500" : "bg-neutral-300"}`}
                        />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-neutral-800">
                          {friend.name ?? "Anonymous"}
                        </p>
                        <p className="text-[11px] text-neutral-400">
                          {friend.online ? "Online" : "Offline"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openChat(friend)}
                        className="rounded-md border border-neutral-200 p-1.5 text-neutral-400 transition-colors hover:border-neutral-300 hover:text-neutral-600"
                        title="Chat"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => startCall(friend, "audio")}
                        className="rounded-md border border-neutral-200 p-1.5 text-neutral-400 transition-colors hover:border-neutral-300 hover:text-neutral-600"
                        title="Voice Call"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => startCall(friend, "video")}
                        className="rounded-md border border-neutral-200 p-1.5 text-neutral-400 transition-colors hover:border-neutral-300 hover:text-neutral-600"
                        title="Video Call"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
                          <rect x="2" y="6" width="14" height="12" rx="2" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleRemoveFriend(friend.friendshipId)}
                        className="rounded-md border border-neutral-200 p-1.5 text-neutral-400 transition-colors hover:border-red-200 hover:text-red-400"
                        title="Remove Friend"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <line x1="17" x2="22" y1="11" y2="11" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "requests" && (
            <div className="divide-y divide-neutral-100">
              {requests.received.length === 0 && requests.sent.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-neutral-400">
                    No pending requests
                  </p>
                </div>
              ) : (
                <>
                  {requests.received.length > 0 && (
                    <div className="p-4">
                      <h3 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                        Received
                      </h3>
                      <div className="space-y-2">
                        {requests.received.map((req) => (
                          <div
                            key={req.id}
                            className="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-3"
                          >
                            <div className="flex items-center gap-3">
                              {req.from?.avatarUrl ? (
                                <img
                                  src={req.from.avatarUrl}
                                  alt=""
                                  className="h-8 w-8 rounded-full"
                                />
                              ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-xs font-medium text-neutral-500">
                                  {(req.from?.name ?? "?")[0]?.toUpperCase()}
                                </div>
                              )}
                              <span className="text-[13px] font-medium text-neutral-700">
                                {req.from?.name ?? "Anonymous"}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAcceptRequest(req.id)}
                                className="rounded-md bg-neutral-900 px-3 py-1 text-[12px] font-medium text-white transition-opacity hover:opacity-85"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleDeclineRequest(req.id)}
                                className="rounded-md border border-neutral-200 px-3 py-1 text-[12px] text-neutral-500 transition-colors hover:border-neutral-300"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {requests.sent.length > 0 && (
                    <div className="p-4">
                      <h3 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                        Sent
                      </h3>
                      <div className="space-y-2">
                        {requests.sent.map((req) => (
                          <div
                            key={req.id}
                            className="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-3"
                          >
                            <div className="flex items-center gap-3">
                              {req.to?.avatarUrl ? (
                                <img
                                  src={req.to.avatarUrl}
                                  alt=""
                                  className="h-8 w-8 rounded-full"
                                />
                              ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-xs font-medium text-neutral-500">
                                  {(req.to?.name ?? "?")[0]?.toUpperCase()}
                                </div>
                              )}
                              <span className="text-[13px] font-medium text-neutral-700">
                                {req.to?.name ?? "Anonymous"}
                              </span>
                            </div>
                            <span className="text-[11px] text-neutral-400">
                              Pending
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {tab === "chat" && (
            <div className="flex h-[500px] flex-col">
              {!activeFriend ? (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-sm text-neutral-400">
                    Select a friend to start chatting
                  </p>
                </div>
              ) : (
                <>
                  {/* Chat Header */}
                  <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setActiveFriend(null);
                          setTab("friends");
                        }}
                        className="text-neutral-400 hover:text-neutral-600"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m15 18-6-6 6-6" />
                        </svg>
                      </button>
                      {activeFriend.avatarUrl ? (
                        <img
                          src={activeFriend.avatarUrl}
                          alt=""
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium text-neutral-500">
                          {(activeFriend.name ?? "?")[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-[13px] font-medium text-neutral-800">
                          {activeFriend.name}
                        </p>
                        <p className="text-[11px] text-neutral-400">
                          {activeFriend.online ? "Online" : "Offline"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => startCall(activeFriend, "audio")}
                        className="rounded-md border border-neutral-200 p-1.5 text-neutral-400 transition-colors hover:border-neutral-300 hover:text-neutral-600"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => startCall(activeFriend, "video")}
                        className="rounded-md border border-neutral-200 p-1.5 text-neutral-400 transition-colors hover:border-neutral-300 hover:text-neutral-600"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
                          <rect x="2" y="6" width="14" height="12" rx="2" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-5 py-4">
                    {messages.length === 0 ? (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-xs text-neutral-400">
                          No messages yet. Say hello!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.senderId === "me" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-xl px-3.5 py-2 ${
                                msg.senderId === "me"
                                  ? "bg-neutral-900 text-white"
                                  : "bg-neutral-100 text-neutral-800"
                              }`}
                            >
                              <p className="text-[13px] leading-relaxed">
                                {msg.content}
                              </p>
                              <p
                                className={`mt-0.5 text-[10px] ${msg.senderId === "me" ? "text-neutral-400" : "text-neutral-400"}`}
                              >
                                {new Date(msg.createdAt).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <form
                    onSubmit={sendMessage}
                    className="border-t border-neutral-100 px-5 py-3"
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={msgInput}
                        onChange={(e) => setMsgInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-[13px] text-neutral-800 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!msgInput.trim()}
                        className="rounded-lg bg-neutral-900 px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-30"
                      >
                        Send
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

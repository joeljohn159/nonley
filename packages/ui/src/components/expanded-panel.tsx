import type { PresenceUser, ReactionType } from "@nonley/types";
import React, { useState } from "react";

export interface ExpandedPanelProps {
  ring1Users: PresenceUser[];
  ring2Users: PresenceUser[];
  ring3Count: number;
  totalCount: number;
  onClose: () => void;
  onWave: (userId: string) => void;
  onReaction: (type: ReactionType, userId: string) => void;
  onWhisperOpen: (userId: string) => void;
  onChatOpen: () => void;
  chatAvailable: boolean;
  chatMessages?: Array<{ id: string; senderName: string; content: string }>;
  onSendChat?: (content: string) => void;
}

type TabView = "people" | "chat";

export function ExpandedPanel({
  ring1Users,
  ring2Users,
  ring3Count,
  totalCount,
  onClose,
  onWave,
  onWhisperOpen,
  onChatOpen,
  chatAvailable,
  chatMessages = [],
  onSendChat,
}: ExpandedPanelProps) {
  const [activeTab, setActiveTab] = useState<TabView>("people");
  const [chatInput, setChatInput] = useState("");

  function handleSendChat() {
    if (chatInput.trim() && onSendChat) {
      onSendChat(chatInput.trim());
      setChatInput("");
    }
  }

  return (
    <div
      style={{
        width: "320px",
        maxHeight: "400px",
        borderRadius: "12px",
        backgroundColor: "var(--nonley-panel-bg, #1a1a2e)",
        color: "var(--nonley-panel-text, #e0e0e0)",
        fontFamily: "'Inter', -apple-system, sans-serif",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
      role="dialog"
      aria-label="Presence panel"
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid var(--nonley-border, #2a2a3e)",
        }}
      >
        <span style={{ fontSize: "13px", fontWeight: 600 }}>
          {totalCount} {totalCount === 1 ? "person" : "people"} here
        </span>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "var(--nonley-panel-text, #e0e0e0)",
            cursor: "pointer",
            fontSize: "18px",
            padding: "0 4px",
          }}
          aria-label="Close panel"
        >
          ×
        </button>
      </div>

      {/* Tabs */}
      {chatAvailable && (
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--nonley-border, #2a2a3e)",
          }}
          role="tablist"
        >
          <TabButton
            active={activeTab === "people"}
            onClick={() => setActiveTab("people")}
            label="People"
          />
          <TabButton
            active={activeTab === "chat"}
            onClick={() => {
              setActiveTab("chat");
              onChatOpen();
            }}
            label="Chat"
          />
        </div>
      )}

      {/* Content */}
      <div
        style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}
        role="tabpanel"
      >
        {activeTab === "people" ? (
          <>
            {ring1Users.length > 0 && (
              <UserSection
                title="Your People"
                users={ring1Users}
                onWave={onWave}
                onWhisperOpen={onWhisperOpen}
              />
            )}
            {ring2Users.length > 0 && (
              <UserSection
                title="Neighbors"
                users={ring2Users}
                onWave={onWave}
                onWhisperOpen={onWhisperOpen}
              />
            )}
            {ring3Count > 0 && (
              <div
                style={{
                  padding: "8px 16px",
                  fontSize: "12px",
                  color: "var(--nonley-text-muted, #888)",
                }}
              >
                +{ring3Count} others browsing this page
              </div>
            )}
          </>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", height: "100%" }}
          >
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px" }}>
              {chatMessages.length === 0 ? (
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--nonley-text-muted, #888)",
                    textAlign: "center",
                    padding: "24px 0",
                  }}
                >
                  No messages yet. Say hi!
                </p>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} style={{ marginBottom: "8px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "var(--nonley-accent, #818cf8)",
                      }}
                    >
                      {msg.senderName}
                    </span>
                    <p style={{ fontSize: "13px", marginTop: "2px" }}>
                      {msg.content}
                    </p>
                  </div>
                ))
              )}
            </div>
            {onSendChat && (
              <div
                style={{
                  padding: "8px 16px",
                  borderTop: "1px solid var(--nonley-border, #2a2a3e)",
                  display: "flex",
                  gap: "8px",
                }}
              >
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                  placeholder="Type a message..."
                  maxLength={280}
                  style={{
                    flex: 1,
                    background: "var(--nonley-bg, #0a0a14)",
                    border: "1px solid var(--nonley-border, #2a2a3e)",
                    borderRadius: "8px",
                    padding: "6px 10px",
                    fontSize: "12px",
                    color: "var(--nonley-panel-text, #e0e0e0)",
                    outline: "none",
                  }}
                  aria-label="Chat message"
                />
                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim()}
                  style={{
                    background: "var(--nonley-accent, #818cf8)",
                    border: "none",
                    borderRadius: "8px",
                    padding: "6px 12px",
                    fontSize: "12px",
                    color: "white",
                    cursor: "pointer",
                    opacity: chatInput.trim() ? 1 : 0.4,
                  }}
                  aria-label="Send message"
                >
                  Send
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={active}
      style={{
        flex: 1,
        padding: "8px",
        background: "none",
        border: "none",
        borderBottom: active
          ? "2px solid var(--nonley-accent, #818cf8)"
          : "2px solid transparent",
        color: active
          ? "var(--nonley-panel-text, #e0e0e0)"
          : "var(--nonley-text-muted, #888)",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: active ? 600 : 400,
      }}
    >
      {label}
    </button>
  );
}

function UserSection({
  title,
  users,
  onWave,
  onWhisperOpen,
}: {
  title: string;
  users: PresenceUser[];
  onWave: (userId: string) => void;
  onWhisperOpen: (userId: string) => void;
}) {
  return (
    <div>
      <div
        style={{
          padding: "4px 16px",
          fontSize: "11px",
          fontWeight: 600,
          color: "var(--nonley-text-muted, #888)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {title}
      </div>
      {users.map((user) => (
        <UserRow
          key={user.userId}
          user={user}
          onWave={() => onWave(user.userId)}
          onWhisperOpen={() => onWhisperOpen(user.userId)}
        />
      ))}
    </div>
  );
}

function UserRow({
  user,
  onWave,
  onWhisperOpen,
}: {
  user: PresenceUser;
  onWave: () => void;
  onWhisperOpen: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "6px 16px",
        gap: "10px",
        cursor: "pointer",
        transition: "background 150ms ease",
      }}
      onClick={onWhisperOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onWhisperOpen();
      }}
      aria-label={`Open whisper with ${user.name || "Anonymous"}`}
    >
      <span
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          backgroundColor: "var(--nonley-avatar-bg, #3a3a5e)",
          backgroundImage: user.avatarUrl
            ? `url(${user.avatarUrl})`
            : undefined,
          backgroundSize: "cover",
          flexShrink: 0,
        }}
        role="img"
        aria-label={user.name || "Anonymous"}
      />
      <span style={{ flex: 1, fontSize: "13px", fontWeight: 500 }}>
        {user.name || "Anonymous"}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onWave();
        }}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "16px",
          padding: "2px",
          opacity: 0.7,
          transition: "opacity 150ms",
        }}
        aria-label={`Wave at ${user.name || "Anonymous"}`}
        title="Wave"
      >
        👋
      </button>
    </div>
  );
}

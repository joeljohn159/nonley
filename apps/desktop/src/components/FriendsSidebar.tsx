/**
 * Friends sidebar: list of friends with online/offline indicators
 * and quick message functionality.
 */

import type { FriendMessageData } from "@nonley/types";
import { useState, useCallback, useEffect, useRef } from "react";

import { useAuthStore } from "../stores/auth";
import { useFriendsStore } from "../stores/friends";

import Avatar from "./Avatar";

interface FriendsSidebarProps {
  sendFriendMessage: (friendshipId: string, content: string) => void;
}

function FriendsSidebar({ sendFriendMessage }: FriendsSidebarProps) {
  const friends = useFriendsStore((s) => s.friends);
  const messages = useFriendsStore((s) => s.messages);
  const friendRequests = useFriendsStore((s) => s.friendRequests);
  const selectedFriendId = useFriendsStore((s) => s.selectedFriendId);
  const setSelectedFriend = useFriendsStore((s) => s.setSelectedFriend);
  const fetchFriends = useFriendsStore((s) => s.fetchFriends);
  const authToken = useAuthStore((s) => s.authToken);

  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch friends on mount
  useEffect(() => {
    if (authToken) {
      fetchFriends(authToken);
    }
  }, [authToken, fetchFriends]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedFriendId, messages]);

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = messageInput.trim();
      if (!trimmed || !selectedFriendId) return;
      sendFriendMessage(selectedFriendId, trimmed);
      setMessageInput("");
    },
    [messageInput, selectedFriendId, sendFriendMessage],
  );

  const onlineFriends = friends.filter((f) => f.online);
  const offlineFriends = friends.filter((f) => !f.online);
  const selectedMessages: FriendMessageData[] = selectedFriendId
    ? (messages[selectedFriendId] ?? [])
    : [];
  const selectedFriend = friends.find(
    (f) => f.friendshipId === selectedFriendId,
  );

  // If a friend is selected, show the chat view
  if (selectedFriendId && selectedFriend) {
    return (
      <div className="flex h-full flex-col">
        {/* Chat header */}
        <div className="border-nonley-border flex items-center gap-2 border-b px-3 py-2">
          <button
            onClick={() => setSelectedFriend(null)}
            className="text-nonley-muted hover:text-nonley-text transition-colors"
            aria-label="Back to friends list"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M10 3L5 8L10 13" />
            </svg>
          </button>
          <Avatar
            name={selectedFriend.name}
            avatarUrl={selectedFriend.avatarUrl}
            size="sm"
            online={selectedFriend.online}
            showIndicator
          />
          <div className="min-w-0 flex-1">
            <p className="text-nonley-text truncate text-sm font-medium">
              {selectedFriend.name ?? "Unknown"}
            </p>
            <p className="text-nonley-muted text-[10px]">
              {selectedFriend.online ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3">
          {selectedMessages.length === 0 && (
            <p className="text-nonley-muted py-8 text-center text-xs">
              No messages yet. Say hello!
            </p>
          )}
          {selectedMessages.map((msg) => (
            <div key={msg.id} className="mb-2">
              <div className="flex items-start gap-2">
                <Avatar
                  name={msg.senderName}
                  avatarUrl={msg.senderAvatar}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-nonley-text text-xs font-medium">
                      {msg.senderName}
                    </span>
                    <span className="text-nonley-muted text-[10px]">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-nonley-text break-words text-sm">
                    {msg.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <form
          onSubmit={handleSendMessage}
          className="border-nonley-border border-t p-2"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type a message..."
              className="border-nonley-border bg-nonley-surface text-nonley-text placeholder-nonley-muted focus:border-nonley-primary flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none transition-colors"
              maxLength={280}
            />
            <button
              type="submit"
              disabled={!messageInput.trim()}
              className="bg-nonley-primary hover:bg-nonley-primary/90 rounded-lg px-3 py-1.5 text-sm text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Friends list view
  return (
    <div className="flex h-full flex-col">
      <div className="border-nonley-border border-b px-3 py-2">
        <h2 className="text-nonley-text text-sm font-medium">Friends</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Friend requests */}
        {friendRequests.length > 0 && (
          <div className="border-nonley-border border-b px-3 py-2">
            <h3 className="text-nonley-muted mb-1 text-[10px] font-medium uppercase tracking-wider">
              Requests ({friendRequests.length})
            </h3>
            {friendRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5"
              >
                <Avatar
                  name={req.from?.name ?? null}
                  avatarUrl={req.from?.avatarUrl ?? null}
                  size="sm"
                />
                <span className="text-nonley-text flex-1 truncate text-sm">
                  {req.from?.name ?? "Someone"}
                </span>
                <div className="flex gap-1">
                  <button className="bg-nonley-accent text-nonley-bg rounded px-2 py-0.5 text-[10px]">
                    Accept
                  </button>
                  <button className="bg-nonley-surface-elevated text-nonley-muted rounded px-2 py-0.5 text-[10px]">
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Online friends */}
        {onlineFriends.length > 0 && (
          <div className="px-3 py-2">
            <h3 className="text-nonley-muted mb-1 text-[10px] font-medium uppercase tracking-wider">
              Online ({onlineFriends.length})
            </h3>
            {onlineFriends.map((friend) => (
              <button
                key={friend.friendshipId}
                onClick={() => setSelectedFriend(friend.friendshipId)}
                className="hover:bg-nonley-surface-elevated flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors"
              >
                <Avatar
                  name={friend.name}
                  avatarUrl={friend.avatarUrl}
                  size="sm"
                  online
                  showIndicator
                />
                <span className="text-nonley-text flex-1 truncate text-sm">
                  {friend.name ?? "Unknown"}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Offline friends */}
        {offlineFriends.length > 0 && (
          <div className="px-3 py-2">
            <h3 className="text-nonley-muted mb-1 text-[10px] font-medium uppercase tracking-wider">
              Offline ({offlineFriends.length})
            </h3>
            {offlineFriends.map((friend) => (
              <button
                key={friend.friendshipId}
                onClick={() => setSelectedFriend(friend.friendshipId)}
                className="hover:bg-nonley-surface-elevated flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors"
              >
                <Avatar
                  name={friend.name}
                  avatarUrl={friend.avatarUrl}
                  size="sm"
                  online={false}
                  showIndicator
                />
                <span className="text-nonley-muted flex-1 truncate text-sm">
                  {friend.name ?? "Unknown"}
                </span>
              </button>
            ))}
          </div>
        )}

        {friends.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-nonley-muted text-sm">No friends yet.</p>
            <p className="text-nonley-muted mt-1 text-xs">
              Wave at someone in a room to connect!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FriendsSidebar;

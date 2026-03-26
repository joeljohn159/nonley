import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { PresenceClient } from "../client";
import type { PresenceClientOptions } from "../client";

// ---- Mock socket.io-client ------------------------------------------------

type EventHandler = (...args: unknown[]) => void;

interface MockSocket {
  on: ReturnType<typeof vi.fn>;
  emit: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  connected: boolean;
  _handlers: Map<string, EventHandler>;
  _simulateEvent: (event: string, ...args: unknown[]) => void;
}

function createMockSocket(): MockSocket {
  const handlers = new Map<string, EventHandler>();

  const socket: MockSocket = {
    on: vi.fn((event: string, handler: EventHandler) => {
      handlers.set(event, handler);
      return socket;
    }),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: true,
    _handlers: handlers,
    _simulateEvent(event: string, ...args: unknown[]) {
      const handler = handlers.get(event);
      if (handler) handler(...args);
    },
  };

  return socket;
}

let mockSocket: MockSocket;

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => mockSocket),
}));

vi.mock("@nonley/config", () => ({
  PRESENCE: {
    HEARTBEAT_INTERVAL_MS: 30_000,
  },
}));

// ---- Helpers ---------------------------------------------------------------

function buildOptions(
  overrides?: Partial<PresenceClientOptions>,
): PresenceClientOptions {
  return {
    url: "wss://presence.nonley.com",
    token: "test-jwt-token",
    ...overrides,
  };
}

// ---- Tests -----------------------------------------------------------------

describe("PresenceClient", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockSocket = createMockSocket();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ---------- connect() ---------------------------------------------------

  describe("connect()", () => {
    it("creates a socket with correct url and options", async () => {
      const { io } = await import("socket.io-client");
      const client = new PresenceClient(buildOptions());

      client.connect();

      expect(io).toHaveBeenCalledWith("wss://presence.nonley.com", {
        auth: { token: "test-jwt-token" },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
      });
    });

    it("does not create a new socket if already connected", async () => {
      const { io } = await import("socket.io-client");
      const client = new PresenceClient(buildOptions());

      client.connect();
      const callCount = (io as ReturnType<typeof vi.fn>).mock.calls.length;

      // Second connect should be a no-op because socket.connected is true
      client.connect();
      expect((io as ReturnType<typeof vi.fn>).mock.calls.length).toBe(
        callCount,
      );
    });

    it("sets up all expected event listeners", () => {
      const client = new PresenceClient(buildOptions());
      client.connect();

      const registeredEvents = Array.from(mockSocket._handlers.keys());
      expect(registeredEvents).toContain("connect");
      expect(registeredEvents).toContain("disconnect");
      expect(registeredEvents).toContain("presence_update");
      expect(registeredEvents).toContain("reaction");
      expect(registeredEvents).toContain("whisper_message");
      expect(registeredEvents).toContain("room_chat_message");
      expect(registeredEvents).toContain("focus_summary");
      expect(registeredEvents).toContain("error");
    });
  });

  // ---------- Event callbacks ---------------------------------------------

  describe("event callbacks", () => {
    it("invokes onConnect when socket emits 'connect'", () => {
      const onConnect = vi.fn();
      const client = new PresenceClient(buildOptions({ onConnect }));
      client.connect();

      mockSocket._simulateEvent("connect");
      expect(onConnect).toHaveBeenCalledOnce();
    });

    it("invokes onDisconnect with reason when socket emits 'disconnect'", () => {
      const onDisconnect = vi.fn();
      const client = new PresenceClient(buildOptions({ onDisconnect }));
      client.connect();

      mockSocket._simulateEvent("disconnect", "io server disconnect");
      expect(onDisconnect).toHaveBeenCalledWith("io server disconnect");
    });

    it("invokes onPresenceUpdate when socket emits 'presence_update'", () => {
      const onPresenceUpdate = vi.fn();
      const client = new PresenceClient(buildOptions({ onPresenceUpdate }));
      client.connect();

      const roomData = {
        roomHash: "abc123",
        totalCount: 5,
        ring1: [],
        ring2: [],
        ring3Count: 3,
      };
      mockSocket._simulateEvent("presence_update", roomData);
      expect(onPresenceUpdate).toHaveBeenCalledWith(roomData);
    });

    it("invokes onReaction when socket emits 'reaction'", () => {
      const onReaction = vi.fn();
      const client = new PresenceClient(buildOptions({ onReaction }));
      client.connect();

      const reaction = {
        type: "wave" as const,
        fromUserId: "u1",
        toUserId: "u2",
        roomHash: "room1",
        timestamp: Date.now(),
      };
      mockSocket._simulateEvent("reaction", reaction);
      expect(onReaction).toHaveBeenCalledWith(reaction);
    });

    it("invokes onWhisperMessage when socket emits 'whisper_message'", () => {
      const onWhisperMessage = vi.fn();
      const client = new PresenceClient(buildOptions({ onWhisperMessage }));
      client.connect();

      const msg = {
        id: "m1",
        chatId: "c1",
        senderId: "u1",
        content: "hi",
        createdAt: new Date(),
      };
      mockSocket._simulateEvent("whisper_message", msg);
      expect(onWhisperMessage).toHaveBeenCalledWith(msg);
    });

    it("invokes onRoomChatMessage when socket emits 'room_chat_message'", () => {
      const onRoomChatMessage = vi.fn();
      const client = new PresenceClient(buildOptions({ onRoomChatMessage }));
      client.connect();

      const msg = {
        id: "m1",
        chatId: "c1",
        senderId: "u1",
        senderName: "Alice",
        senderAvatar: "https://example.com/a.png",
        content: "hello room",
        createdAt: new Date(),
      };
      mockSocket._simulateEvent("room_chat_message", msg);
      expect(onRoomChatMessage).toHaveBeenCalledWith(msg);
    });

    it("invokes onFocusSummary when socket emits 'focus_summary'", () => {
      const onFocusSummary = vi.fn();
      const client = new PresenceClient(buildOptions({ onFocusSummary }));
      client.connect();

      const summary = {
        waves: 3,
        newCircleMembers: ["u1"],
        missedReactions: 7,
      };
      mockSocket._simulateEvent("focus_summary", summary);
      expect(onFocusSummary).toHaveBeenCalledWith(summary);
    });

    it("invokes onError when socket emits 'error'", () => {
      const onError = vi.fn();
      const client = new PresenceClient(buildOptions({ onError }));
      client.connect();

      const error = { code: "AUTH_FAILED", message: "Invalid token" };
      mockSocket._simulateEvent("error", error);
      expect(onError).toHaveBeenCalledWith(error);
    });

    it("does not throw when callbacks are not provided", () => {
      const client = new PresenceClient(buildOptions());
      client.connect();

      // Simulate every event -- none should throw because callbacks are optional
      expect(() => mockSocket._simulateEvent("connect")).not.toThrow();
      expect(() =>
        mockSocket._simulateEvent("disconnect", "reason"),
      ).not.toThrow();
      expect(() =>
        mockSocket._simulateEvent("presence_update", {}),
      ).not.toThrow();
      expect(() => mockSocket._simulateEvent("reaction", {})).not.toThrow();
      expect(() =>
        mockSocket._simulateEvent("whisper_message", {}),
      ).not.toThrow();
      expect(() =>
        mockSocket._simulateEvent("room_chat_message", {}),
      ).not.toThrow();
      expect(() =>
        mockSocket._simulateEvent("focus_summary", {}),
      ).not.toThrow();
      expect(() => mockSocket._simulateEvent("error", {})).not.toThrow();
    });
  });

  // ---------- joinRoom() --------------------------------------------------

  describe("joinRoom()", () => {
    it("emits 'join_room' with the correct payload", () => {
      const client = new PresenceClient(buildOptions());
      client.connect();

      const payload = { roomHash: "hash123", urlHash: "urlhash456" };
      client.joinRoom(payload);

      expect(mockSocket.emit).toHaveBeenCalledWith("join_room", payload);
    });

    it("stores the currentRoomHash (exposed via roomHash getter)", () => {
      const client = new PresenceClient(buildOptions());
      client.connect();

      expect(client.roomHash).toBeNull();

      client.joinRoom({ roomHash: "hash123", urlHash: "urlhash456" });
      expect(client.roomHash).toBe("hash123");
    });

    it("starts a heartbeat interval that emits 'heartbeat' every 30 seconds", () => {
      const client = new PresenceClient(buildOptions());
      client.connect();

      client.joinRoom({ roomHash: "hash123", urlHash: "urlhash456" });

      // No heartbeat yet at t=0 (setInterval fires after the first interval)
      const emitCallsBefore = mockSocket.emit.mock.calls.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call: any[]) => call[0] === "heartbeat",
      ).length;

      vi.advanceTimersByTime(30_000);

      const emitCallsAfter = mockSocket.emit.mock.calls.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call: any[]) => call[0] === "heartbeat",
      ).length;

      expect(emitCallsAfter - emitCallsBefore).toBe(1);
      expect(mockSocket.emit).toHaveBeenCalledWith("heartbeat", {
        roomHash: "hash123",
      });
    });

    it("emits multiple heartbeats over time", () => {
      const client = new PresenceClient(buildOptions());
      client.connect();

      client.joinRoom({ roomHash: "hash123", urlHash: "urlhash456" });

      vi.advanceTimersByTime(90_000); // 3 intervals

      const heartbeatCalls = mockSocket.emit.mock.calls.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call: any[]) => call[0] === "heartbeat",
      );
      expect(heartbeatCalls.length).toBe(3);
    });
  });

  // ---------- leaveRoom() -------------------------------------------------

  describe("leaveRoom()", () => {
    it("emits 'leave_room' with the current roomHash", () => {
      const client = new PresenceClient(buildOptions());
      client.connect();
      client.joinRoom({ roomHash: "hash123", urlHash: "urlhash456" });

      client.leaveRoom();

      expect(mockSocket.emit).toHaveBeenCalledWith("leave_room", {
        roomHash: "hash123",
      });
    });

    it("clears the currentRoomHash", () => {
      const client = new PresenceClient(buildOptions());
      client.connect();
      client.joinRoom({ roomHash: "hash123", urlHash: "urlhash456" });

      client.leaveRoom();
      expect(client.roomHash).toBeNull();
    });

    it("stops the heartbeat interval", () => {
      const client = new PresenceClient(buildOptions());
      client.connect();
      client.joinRoom({ roomHash: "hash123", urlHash: "urlhash456" });

      client.leaveRoom();

      // Advance well past one heartbeat interval -- no heartbeat should fire
      vi.advanceTimersByTime(60_000);

      const heartbeatCalls = mockSocket.emit.mock.calls.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call: any[]) => call[0] === "heartbeat",
      );
      expect(heartbeatCalls.length).toBe(0);
    });

    it("does nothing when not in a room", () => {
      const client = new PresenceClient(buildOptions());
      client.connect();

      // Should not throw or emit
      client.leaveRoom();
      const leaveCalls = mockSocket.emit.mock.calls.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call: any[]) => call[0] === "leave_room",
      );
      expect(leaveCalls.length).toBe(0);
    });
  });

  // ---------- sendReaction() ----------------------------------------------

  describe("sendReaction()", () => {
    it("does nothing when not in a room", () => {
      const client = new PresenceClient(buildOptions());
      client.connect();

      client.sendReaction("wave", "user-2");

      const reactionCalls = mockSocket.emit.mock.calls.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call: any[]) => call[0] === "send_reaction",
      );
      expect(reactionCalls.length).toBe(0);
    });

    it("emits 'send_reaction' with roomHash when in a room", () => {
      const client = new PresenceClient(buildOptions());
      client.connect();
      client.joinRoom({ roomHash: "hash123", urlHash: "urlhash456" });

      client.sendReaction("wave", "user-2");

      expect(mockSocket.emit).toHaveBeenCalledWith("send_reaction", {
        type: "wave",
        fromUserId: "",
        toUserId: "user-2",
        roomHash: "hash123",
      });
    });

    it("does not emit after leaving the room", () => {
      const client = new PresenceClient(buildOptions());
      client.connect();
      client.joinRoom({ roomHash: "hash123", urlHash: "urlhash456" });
      client.leaveRoom();

      client.sendReaction("fire", "user-3");

      const reactionCalls = mockSocket.emit.mock.calls.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call: any[]) => call[0] === "send_reaction",
      );
      expect(reactionCalls.length).toBe(0);
    });
  });

  // ---------- sendWhisper() -----------------------------------------------

  describe("sendWhisper()", () => {
    it("emits 'send_whisper' with chatId and content", () => {
      const client = new PresenceClient(buildOptions());
      client.connect();

      client.sendWhisper("chat-1", "hello there");

      expect(mockSocket.emit).toHaveBeenCalledWith("send_whisper", {
        chatId: "chat-1",
        content: "hello there",
      });
    });
  });

  // ---------- sendRoomChat() ----------------------------------------------

  describe("sendRoomChat()", () => {
    it("emits 'send_room_chat' with chatId and content", () => {
      const client = new PresenceClient(buildOptions());
      client.connect();

      client.sendRoomChat("room-chat-1", "hey everyone");

      expect(mockSocket.emit).toHaveBeenCalledWith("send_room_chat", {
        chatId: "room-chat-1",
        content: "hey everyone",
      });
    });
  });

  // ---------- toggleFocus() -----------------------------------------------

  describe("toggleFocus()", () => {
    it("emits 'toggle_focus' with true", () => {
      const client = new PresenceClient(buildOptions());
      client.connect();

      client.toggleFocus(true);
      expect(mockSocket.emit).toHaveBeenCalledWith("toggle_focus", true);
    });

    it("emits 'toggle_focus' with false", () => {
      const client = new PresenceClient(buildOptions());
      client.connect();

      client.toggleFocus(false);
      expect(mockSocket.emit).toHaveBeenCalledWith("toggle_focus", false);
    });
  });

  // ---------- disconnect() ------------------------------------------------

  describe("disconnect()", () => {
    it("calls socket.disconnect()", () => {
      const client = new PresenceClient(buildOptions());
      client.connect();

      client.disconnect();
      expect(mockSocket.disconnect).toHaveBeenCalledOnce();
    });

    it("leaves the room before disconnecting if in one", () => {
      const client = new PresenceClient(buildOptions());
      client.connect();
      client.joinRoom({ roomHash: "hash123", urlHash: "urlhash456" });

      client.disconnect();

      expect(mockSocket.emit).toHaveBeenCalledWith("leave_room", {
        roomHash: "hash123",
      });
    });

    it("stops the heartbeat", () => {
      const client = new PresenceClient(buildOptions());
      client.connect();
      client.joinRoom({ roomHash: "hash123", urlHash: "urlhash456" });

      client.disconnect();

      vi.advanceTimersByTime(60_000);

      const heartbeatCalls = mockSocket.emit.mock.calls.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call: any[]) => call[0] === "heartbeat",
      );
      expect(heartbeatCalls.length).toBe(0);
    });

    it("clears the room hash", () => {
      const client = new PresenceClient(buildOptions());
      client.connect();
      client.joinRoom({ roomHash: "hash123", urlHash: "urlhash456" });

      client.disconnect();
      expect(client.roomHash).toBeNull();
    });

    it("does not throw when called without a prior connect", () => {
      const client = new PresenceClient(buildOptions());
      expect(() => client.disconnect()).not.toThrow();
    });
  });

  // ---------- connected getter -------------------------------------------

  describe("connected getter", () => {
    it("returns false before connect() is called", () => {
      const client = new PresenceClient(buildOptions());
      expect(client.connected).toBe(false);
    });

    it("returns true when socket.connected is true", () => {
      const client = new PresenceClient(buildOptions());
      mockSocket.connected = true;
      client.connect();
      expect(client.connected).toBe(true);
    });

    it("returns false when socket.connected is false", () => {
      const client = new PresenceClient(buildOptions());
      mockSocket.connected = false;
      client.connect();

      // After connect(), the socket exists but is not yet connected
      // (we set connected = false on our mock before calling connect)
      // connect() creates a new socket because the previous check fails
      expect(client.connected).toBe(false);
    });

    it("returns false after disconnect()", () => {
      const client = new PresenceClient(buildOptions());
      client.connect();

      client.disconnect();
      expect(client.connected).toBe(false);
    });
  });

  // ---------- Reconnect behaviour -----------------------------------------

  describe("reconnect behaviour", () => {
    it("re-joins the room on reconnect if was in a room", () => {
      const client = new PresenceClient(buildOptions());
      client.connect();
      client.joinRoom({ roomHash: "hash123", urlHash: "hash123" });

      // Clear previous emit calls so we can inspect only the reconnect ones
      mockSocket.emit.mockClear();

      // Simulate a reconnect by firing the 'connect' event again
      mockSocket._simulateEvent("connect");

      expect(mockSocket.emit).toHaveBeenCalledWith("join_room", {
        roomHash: "hash123",
        urlHash: "hash123",
      });
    });

    it("does not re-join if was not in a room before reconnect", () => {
      const client = new PresenceClient(buildOptions());
      client.connect();

      mockSocket.emit.mockClear();

      mockSocket._simulateEvent("connect");

      const joinCalls = mockSocket.emit.mock.calls.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call: any[]) => call[0] === "join_room",
      );
      expect(joinCalls.length).toBe(0);
    });

    it("stops heartbeat on disconnect event", () => {
      const client = new PresenceClient(buildOptions());
      client.connect();
      client.joinRoom({ roomHash: "hash123", urlHash: "urlhash456" });

      // Simulate server-side disconnect
      mockSocket._simulateEvent("disconnect", "transport close");

      // Advance past heartbeat interval -- no heartbeat should fire
      mockSocket.emit.mockClear();
      vi.advanceTimersByTime(60_000);

      const heartbeatCalls = mockSocket.emit.mock.calls.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call: any[]) => call[0] === "heartbeat",
      );
      expect(heartbeatCalls.length).toBe(0);
    });

    it("restarts heartbeat when re-joining room on reconnect", () => {
      const client = new PresenceClient(buildOptions());
      client.connect();
      client.joinRoom({ roomHash: "hash123", urlHash: "hash123" });

      // Simulate disconnect (stops heartbeat)
      mockSocket._simulateEvent("disconnect", "transport close");
      mockSocket.emit.mockClear();

      // Simulate reconnect (should re-join and restart heartbeat)
      mockSocket._simulateEvent("connect");
      mockSocket.emit.mockClear();

      vi.advanceTimersByTime(30_000);

      const heartbeatCalls = mockSocket.emit.mock.calls.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call: any[]) => call[0] === "heartbeat",
      );
      expect(heartbeatCalls.length).toBe(1);
      expect(mockSocket.emit).toHaveBeenCalledWith("heartbeat", {
        roomHash: "hash123",
      });
    });
  });

  // ---------- roomHash getter --------------------------------------------

  describe("roomHash getter", () => {
    it("returns null initially", () => {
      const client = new PresenceClient(buildOptions());
      expect(client.roomHash).toBeNull();
    });

    it("returns the hash after joinRoom", () => {
      const client = new PresenceClient(buildOptions());
      client.connect();
      client.joinRoom({ roomHash: "abc", urlHash: "def" });
      expect(client.roomHash).toBe("abc");
    });

    it("returns null after leaveRoom", () => {
      const client = new PresenceClient(buildOptions());
      client.connect();
      client.joinRoom({ roomHash: "abc", urlHash: "def" });
      client.leaveRoom();
      expect(client.roomHash).toBeNull();
    });
  });
});

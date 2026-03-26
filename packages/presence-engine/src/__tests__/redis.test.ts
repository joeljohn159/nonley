import { describe, it, expect } from "vitest";

import { KEYS } from "../redis";

describe("KEYS", () => {
  it('roomCount("abc") returns "room:abc:count"', () => {
    expect(KEYS.roomCount("abc")).toBe("room:abc:count");
  });

  it('roomUsers("abc") returns "room:abc:users"', () => {
    expect(KEYS.roomUsers("abc")).toBe("room:abc:users");
  });

  it('userRooms("user1") returns "user:user1:rooms"', () => {
    expect(KEYS.userRooms("user1")).toBe("user:user1:rooms");
  });

  it('userHeartbeat("user1", "abc") returns "hb:user1:abc"', () => {
    expect(KEYS.userHeartbeat("user1", "abc")).toBe("hb:user1:abc");
  });

  it('userFriends("user1") returns "user:user1:friends"', () => {
    expect(KEYS.userFriends("user1")).toBe("user:user1:friends");
  });

  it('rateLimitReaction("user1") returns "rl:reaction:user1"', () => {
    expect(KEYS.rateLimitReaction("user1")).toBe("rl:reaction:user1");
  });

  it('rateLimitWhisper("user1") returns "rl:whisper:user1"', () => {
    expect(KEYS.rateLimitWhisper("user1")).toBe("rl:whisper:user1");
  });

  it('rateLimitRoomChat("abc") returns "rl:roomchat:abc"', () => {
    expect(KEYS.rateLimitRoomChat("abc")).toBe("rl:roomchat:abc");
  });
});

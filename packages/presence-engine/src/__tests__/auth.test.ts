import jwt from "jsonwebtoken";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { authenticateSocket } from "../middleware/auth";

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
  },
}));

function createMockSocket(token?: string) {
  return {
    handshake: {
      auth: {
        token,
      },
    },
    data: {} as Record<string, unknown>,
  } as unknown as Parameters<typeof authenticateSocket>[0];
}

describe("authenticateSocket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXTAUTH_SECRET = "test-secret";
  });

  it("calls next with error when no token is provided", () => {
    const socket = createMockSocket(undefined);
    const next = vi.fn();

    authenticateSocket(socket, next);

    expect(next).toHaveBeenCalledOnce();
    const error = next.mock.calls[0]![0] as Error;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Authentication required");
  });

  it("calls next with error when NEXTAUTH_SECRET is not set", () => {
    delete process.env.NEXTAUTH_SECRET;

    const socket = createMockSocket("some-token");
    const next = vi.fn();

    authenticateSocket(socket, next);

    expect(next).toHaveBeenCalledOnce();
    const error = next.mock.calls[0]![0] as Error;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Server configuration error");
  });

  it("calls next with error for invalid/expired JWT", () => {
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error("jwt expired");
    });

    const socket = createMockSocket("bad-token");
    const next = vi.fn();

    authenticateSocket(socket, next);

    expect(jwt.verify).toHaveBeenCalledWith("bad-token", "test-secret");
    expect(next).toHaveBeenCalledOnce();
    const error = next.mock.calls[0]![0] as Error;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Invalid or expired token");
  });

  it("sets socket.data correctly for a valid JWT", () => {
    const payload = {
      userId: "u123",
      email: "test@example.com",
      name: "Test User",
      avatarUrl: "https://example.com/avatar.png",
    };
    vi.mocked(jwt.verify).mockReturnValue(
      payload as unknown as ReturnType<typeof jwt.verify>,
    );

    const socket = createMockSocket("valid-token");
    const next = vi.fn();

    authenticateSocket(socket, next);

    expect(socket.data.userId).toBe("u123");
    expect(socket.data.email).toBe("test@example.com");
    expect(socket.data.name).toBe("Test User");
    expect(socket.data.avatarUrl).toBe("https://example.com/avatar.png");
  });

  it("calls next() with no error for a valid token", () => {
    const payload = {
      userId: "u123",
      email: "test@example.com",
    };
    vi.mocked(jwt.verify).mockReturnValue(
      payload as unknown as ReturnType<typeof jwt.verify>,
    );

    const socket = createMockSocket("valid-token");
    const next = vi.fn();

    authenticateSocket(socket, next);

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });

  it("sets name and avatarUrl to null when not present in payload", () => {
    const payload = {
      userId: "u456",
      email: "minimal@example.com",
    };
    vi.mocked(jwt.verify).mockReturnValue(
      payload as unknown as ReturnType<typeof jwt.verify>,
    );

    const socket = createMockSocket("valid-token");
    const next = vi.fn();

    authenticateSocket(socket, next);

    expect(socket.data.name).toBeNull();
    expect(socket.data.avatarUrl).toBeNull();
  });
});

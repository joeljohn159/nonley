import { getServerSession } from "next-auth";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

import {
  ApiError,
  requireAuth,
  requireAdmin,
  successResponse,
  errorResponse,
  parseBody,
} from "@/lib/api-helpers";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

const mockGetServerSession = vi.mocked(getServerSession);

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// ApiError class
// ---------------------------------------------------------------------------
describe("ApiError", () => {
  it("constructs with status, code, and message", () => {
    const err = new ApiError(404, "NOT_FOUND", "Resource not found");

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.message).toBe("Resource not found");
  });
});

// ---------------------------------------------------------------------------
// requireAuth
// ---------------------------------------------------------------------------
describe("requireAuth", () => {
  it("throws 401 when there is no session", async () => {
    mockGetServerSession.mockResolvedValue(null);

    await expect(requireAuth()).rejects.toThrow(ApiError);
    await expect(requireAuth()).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
    });
  });

  it("throws 401 when session exists but user has no id", async () => {
    mockGetServerSession.mockResolvedValue({ user: {} });

    await expect(requireAuth()).rejects.toThrow(ApiError);
    await expect(requireAuth()).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
    });
  });

  it("returns session when valid user with id is present", async () => {
    const session = { user: { id: "user-1", name: "Test" } };
    mockGetServerSession.mockResolvedValue(session);

    const result = await requireAuth();
    expect(result).toEqual(session);
  });
});

// ---------------------------------------------------------------------------
// requireAdmin
// ---------------------------------------------------------------------------
describe("requireAdmin", () => {
  it("throws 403 when user is not an admin", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-1", isAdmin: false },
    });

    await expect(requireAdmin()).rejects.toThrow(ApiError);
    await expect(requireAdmin()).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
    });
  });

  it("returns session when user is an admin", async () => {
    const session = { user: { id: "admin-1", isAdmin: true } };
    mockGetServerSession.mockResolvedValue(session);

    const result = await requireAdmin();
    expect(result).toEqual(session);
  });
});

// ---------------------------------------------------------------------------
// successResponse
// ---------------------------------------------------------------------------
describe("successResponse", () => {
  it("returns JSON with success:true, data, and meta", async () => {
    const data = { items: [1, 2, 3] };
    const response = successResponse(data);

    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual(data);
    expect(json.meta).toBeDefined();
    expect(json.meta.requestId).toBeDefined();
    expect(typeof json.meta.requestId).toBe("string");
    expect(json.meta.timestamp).toBeDefined();
  });

  it("accepts a custom status code", async () => {
    const response = successResponse({ id: "new-1" }, 201);

    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual({ id: "new-1" });
  });
});

// ---------------------------------------------------------------------------
// errorResponse
// ---------------------------------------------------------------------------
describe("errorResponse", () => {
  it("handles ApiError with its status and code", async () => {
    const error = new ApiError(404, "NOT_FOUND", "Resource not found");
    const response = errorResponse(error);

    expect(response.status).toBe(404);

    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("NOT_FOUND");
    expect(json.error.message).toBe("Resource not found");
  });

  it("handles ZodError with 400 status and validation details", async () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    let zodError: z.ZodError | undefined;
    try {
      schema.parse({ name: 123, age: "not-a-number" });
    } catch (e) {
      zodError = e as z.ZodError;
    }

    expect(zodError).toBeDefined();
    const response = errorResponse(zodError!);

    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.message).toBe("Invalid input");
    expect(Array.isArray(json.error.details)).toBe(true);
    expect(json.error.details.length).toBeGreaterThan(0);
  });

  it("handles unknown errors with 500 status", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = errorResponse(new Error("something broke"));

    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INTERNAL_ERROR");
    expect(json.error.message).toBe("An unexpected error occurred");

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// parseBody
// ---------------------------------------------------------------------------
describe("parseBody", () => {
  const schema = z.object({
    name: z.string(),
    email: z.string().email(),
  });

  it("parses valid JSON against a Zod schema", async () => {
    const body = { name: "Alice", email: "alice@example.com" };
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

    const result = await parseBody(req, schema);
    expect(result).toEqual(body);
  });

  it("throws ZodError for invalid input", async () => {
    const body = { name: 42, email: "not-an-email" };
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

    await expect(parseBody(req, schema)).rejects.toThrow(z.ZodError);
  });
});

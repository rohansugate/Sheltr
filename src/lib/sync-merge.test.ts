import { describe, expect, it } from "vitest";
import { mergeDemoPayload, sanitizeDemoPayload } from "@/lib/sync-merge";

describe("demo sync sanitize/merge", () => {
  it("normalizes incomplete payloads instead of crashing", () => {
    const sanitized = sanitizeDemoPayload({
      updatedAt: "2026-01-01T00:00:00.000Z",
    } as never);

    expect(sanitized.listings).toEqual([]);
    expect(sanitized.applications).toEqual([]);
    expect(sanitized.messages).toEqual([]);
  });

  it("merges a partial incoming payload safely", () => {
    const merged = mergeDemoPayload(null, {
      role: "SEEKER",
    } as never);

    expect(merged.listings).toEqual([]);
    expect(merged.updatedAt).toBeTruthy();
  });
});

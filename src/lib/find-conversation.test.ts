import { describe, expect, it } from "vitest";
import type { Conversation } from "./types";
import { findConversationId } from "./unread-counts";

const convo = (over: Partial<Conversation>): Conversation => ({
  id: "c",
  listingId: "l1",
  listingTitle: "Listing",
  seekerId: "s1",
  seekerName: "Sam",
  landlordId: "ll1",
  landlordName: "Lee",
  createdAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

describe("findConversationId", () => {
  it("finds the showing thread an application reused", () => {
    const list = [convo({ id: "convo-showing-sh1", showingId: "sh1", applicationId: "app1" })];
    expect(findConversationId(list, { applicationId: "app1", showingId: "sh1" })).toBe(
      "convo-showing-sh1",
    );
  });

  it("falls back to the showing thread before the application is linked", () => {
    const list = [convo({ id: "convo-showing-sh1", showingId: "sh1" })];
    expect(findConversationId(list, { applicationId: "app1", showingId: "sh1" })).toBe(
      "convo-showing-sh1",
    );
  });

  it("returns undefined when no thread exists", () => {
    expect(findConversationId([], { applicationId: "app1" })).toBeUndefined();
  });
});

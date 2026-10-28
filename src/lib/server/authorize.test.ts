import { describe, expect, it } from "vitest";
import type { Application, ChatMessage, Conversation, Showing } from "../types";
import {
  authorizeApplication,
  authorizeConversation,
  authorizeMessage,
  authorizeShowing,
  conversationReadField,
  counterpart,
  sanitizeNotification,
  type Actor,
} from "./authorize";

const tenant: Actor = { id: "tenant1", role: "SEEKER", name: "Tia Tenant" };
const otherTenant: Actor = { id: "tenant2", role: "SEEKER", name: "Other" };
const landlord: Actor = { id: "landlord1", role: "LANDLORD", name: "Lee Landlord" };
const otherLandlord: Actor = { id: "landlord2", role: "LANDLORD", name: "Other LL" };

const showing: Showing = {
  id: "showing-1",
  listingId: "listing-1",
  seekerId: "tenant1",
  seekerName: "Tia Tenant",
  date: "2026-11-01",
  time: "10:00",
  contactMethod: "phone",
  contactValue: "555",
  status: "REQUESTED",
  createdAt: "2026-10-01T00:00:00.000Z",
};

const packet = {
  voucherSize: 2,
  maxRent: 1600,
  voucherCaseNumber: "X",
  employment: "",
  references: "",
};

const application: Application = {
  id: "app-1",
  listingId: "listing-1",
  showingId: "showing-1",
  seekerId: "tenant1",
  seekerName: "Tia Tenant",
  packet,
  status: "SENT",
  sentAt: "2026-10-02T00:00:00.000Z",
};

const conversation: Conversation = {
  id: "convo-showing-showing-1",
  listingId: "listing-1",
  listingTitle: "Unit",
  seekerId: "tenant1",
  seekerName: "Tia Tenant",
  landlordId: "landlord1",
  landlordName: "Lee Landlord",
  showingId: "showing-1",
  createdAt: "2026-10-03T00:00:00.000Z",
};

describe("authorizeShowing", () => {
  it("forces a new request to belong to the signed-in tenant", () => {
    const saved = authorizeShowing(
      tenant,
      { ...showing, seekerId: "someone-else", status: "ACCEPTED" },
      null,
      "landlord1",
    );
    expect(saved.seekerId).toBe("tenant1");
    expect(saved.status).toBe("REQUESTED");
  });

  it("rejects landlords creating showings", () => {
    expect(() => authorizeShowing(landlord, showing, null, "landlord1")).toThrow();
  });

  it("lets only the listing owner accept or decline", () => {
    const accepted = authorizeShowing(
      landlord,
      { ...showing, status: "ACCEPTED", seekerId: "hijack" },
      showing,
      "landlord1",
    );
    expect(accepted.status).toBe("ACCEPTED");
    expect(accepted.seekerId).toBe("tenant1");
    expect(() =>
      authorizeShowing(otherLandlord, { ...showing, status: "ACCEPTED" }, showing, "landlord1"),
    ).toThrow();
  });

  it("stops tenants from approving their own showing", () => {
    expect(() =>
      authorizeShowing(tenant, { ...showing, status: "ACCEPTED" }, showing, "landlord1"),
    ).toThrow();
  });

  it("rejects ids Appwrite cannot store", () => {
    expect(() =>
      authorizeShowing(tenant, { ...showing, id: "x".repeat(40) }, null, "landlord1"),
    ).toThrow();
  });
});

describe("authorizeApplication", () => {
  const accepted = { ...showing, status: "ACCEPTED" as const };

  it("requires the tenant's own accepted showing", () => {
    expect(authorizeApplication(tenant, application, null, "landlord1", accepted).status).toBe(
      "SENT",
    );
    expect(() =>
      authorizeApplication(tenant, application, null, "landlord1", showing),
    ).toThrow();
    expect(() =>
      authorizeApplication(otherTenant, application, null, "landlord1", accepted),
    ).toThrow();
  });

  it("lets only the listing owner change status", () => {
    expect(
      authorizeApplication(landlord, { ...application, status: "ACCEPTED" }, application, "landlord1", null)
        .status,
    ).toBe("ACCEPTED");
    expect(() =>
      authorizeApplication(tenant, { ...application, status: "ACCEPTED" }, application, "landlord1", null),
    ).toThrow();
  });
});

describe("conversations and messages", () => {
  it("creates a conversation only between the listing owner and a linked tenant", () => {
    expect(authorizeConversation(landlord, conversation, null, "landlord1", "tenant1")).not.toBeNull();
    expect(() =>
      authorizeConversation(landlord, conversation, null, "landlord2", "tenant1"),
    ).toThrow();
    expect(() =>
      authorizeConversation(landlord, conversation, null, "landlord1", null),
    ).toThrow();
    expect(() =>
      authorizeConversation(otherTenant, { ...conversation, seekerId: "tenant2" }, null, "landlord1", "tenant1"),
    ).toThrow();
  });

  it("stamps the sender from the session and blocks outsiders", () => {
    const message: ChatMessage = {
      id: "msg-1",
      conversationId: conversation.id,
      senderId: "landlord1",
      senderRole: "LANDLORD",
      text: "  hi  ",
      sentAt: "2000-01-01T00:00:00.000Z",
    };
    const saved = authorizeMessage(tenant, message, conversation);
    expect(saved.senderId).toBe("tenant1");
    expect(saved.senderRole).toBe("SEEKER");
    expect(saved.text).toBe("hi");
    expect(() => authorizeMessage(otherTenant, message, conversation)).toThrow();
    expect(() => authorizeMessage(tenant, message, null)).toThrow();
  });

  it("maps read receipts to the actor's side only", () => {
    expect(conversationReadField(tenant, conversation)).toBe("seekerLastReadAt");
    expect(conversationReadField(landlord, conversation)).toBe("landlordLastReadAt");
    expect(() => conversationReadField(otherLandlord, conversation)).toThrow();
  });
});

describe("notifications", () => {
  it("targets only the counterpart of the record", () => {
    const recipient = counterpart(tenant, "tenant1", "landlord1")!;
    const n = sanitizeNotification(
      tenant,
      {
        id: "notif-1",
        title: "t",
        message: "m",
        channels: ["in_app"],
        read: true,
        createdAt: "",
        seekerId: "victim",
        conversationId: "someone-elses",
      },
      recipient,
      conversation.id,
    );
    expect(n.landlordId).toBe("landlord1");
    expect(n.seekerId).toBeUndefined();
    expect(n.conversationId).toBeUndefined();
    expect(n.read).toBe(false);
  });
});

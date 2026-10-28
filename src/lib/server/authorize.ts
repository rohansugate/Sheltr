import type {
  Application,
  ChatMessage,
  Conversation,
  Notification,
  Showing,
} from "../types";

export interface Actor {
  id: string;
  role: "SEEKER" | "LANDLORD";
  name: string;
}

export interface Recipient {
  id: string;
  role: "SEEKER" | "LANDLORD";
}

export class PersistError extends Error {
  constructor(
    message: string,
    public status: 400 | 403 | 404 = 403,
  ) {
    super(message);
  }
}

const DOC_ID = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/;

export function assertDocId(id: string | undefined, kind: string): string {
  if (!id || !DOC_ID.test(id)) {
    throw new PersistError(`Invalid ${kind} id`, 400);
  }
  return id;
}

export function authorizeShowing(
  actor: Actor,
  incoming: Showing,
  existing: Showing | null,
  listingOwnerId: string | null,
): Showing {
  assertDocId(incoming.id, "showing");
  const now = new Date().toISOString();

  if (!existing) {
    if (actor.role !== "SEEKER") {
      throw new PersistError("Only tenants can request showings");
    }
    return {
      ...incoming,
      seekerId: actor.id,
      seekerName: actor.name,
      status: "REQUESTED",
      landlordMessage: undefined,
      createdAt: incoming.createdAt || now,
      updatedAt: now,
    };
  }

  if (actor.role === "LANDLORD" && listingOwnerId === actor.id) {
    return {
      ...existing,
      status: incoming.status,
      landlordMessage: incoming.landlordMessage?.slice(0, 1000),
      updatedAt: now,
    };
  }

  if (
    actor.role === "SEEKER" &&
    existing.seekerId === actor.id &&
    existing.status === "REQUESTED" &&
    incoming.status === "REQUESTED"
  ) {
    return {
      ...existing,
      date: incoming.date,
      time: incoming.time,
      contactMethod: incoming.contactMethod,
      contactValue: incoming.contactValue,
      updatedAt: now,
    };
  }

  throw new PersistError("Not allowed to update this showing");
}

export function authorizeApplication(
  actor: Actor,
  incoming: Application,
  existing: Application | null,
  listingOwnerId: string | null,
  showing: Showing | null,
): Application {
  assertDocId(incoming.id, "application");
  const now = new Date().toISOString();

  if (!existing) {
    if (actor.role !== "SEEKER") {
      throw new PersistError("Only tenants can apply");
    }
    if (
      !showing ||
      showing.seekerId !== actor.id ||
      showing.listingId !== incoming.listingId ||
      showing.status !== "ACCEPTED"
    ) {
      throw new PersistError("An accepted showing is required to apply");
    }
    return {
      ...incoming,
      showingId: showing.id,
      seekerId: actor.id,
      seekerName: actor.name,
      status: "SENT",
      sentAt: incoming.sentAt || now,
      updatedAt: now,
    };
  }

  if (actor.role === "LANDLORD" && listingOwnerId === actor.id) {
    return { ...existing, status: incoming.status, updatedAt: now };
  }

  throw new PersistError("Not allowed to update this application");
}

export function isParticipant(actor: Actor, conversation: Conversation) {
  return actor.role === "SEEKER"
    ? conversation.seekerId === actor.id
    : conversation.landlordId === actor.id;
}

/**
 * New conversations must link a landlord who owns the listing with the tenant
 * on an accepted showing or application for it.
 */
export function authorizeConversation(
  actor: Actor,
  incoming: Conversation,
  existing: Conversation | null,
  listingOwnerId: string | null,
  linkedSeekerId: string | null,
): Conversation | null {
  assertDocId(incoming.id, "conversation");

  if (existing) {
    if (!isParticipant(actor, existing)) {
      throw new PersistError("Not a participant in this conversation");
    }
    return null;
  }

  if (!listingOwnerId || incoming.landlordId !== listingOwnerId) {
    throw new PersistError("Conversation landlord must own the listing");
  }
  if (!linkedSeekerId || incoming.seekerId !== linkedSeekerId) {
    throw new PersistError("Conversation tenant must have an accepted showing or application");
  }
  if (!isParticipant(actor, incoming)) {
    throw new PersistError("Not a participant in this conversation");
  }

  return {
    ...incoming,
    seekerName: actor.role === "SEEKER" ? actor.name : incoming.seekerName,
    landlordName: actor.role === "LANDLORD" ? actor.name : incoming.landlordName,
    createdAt: incoming.createdAt || new Date().toISOString(),
  };
}

export function authorizeMessage(
  actor: Actor,
  incoming: ChatMessage,
  conversation: Conversation | null,
): ChatMessage {
  assertDocId(incoming.id, "message");
  if (!conversation) throw new PersistError("Conversation not found", 404);
  if (incoming.conversationId !== conversation.id) {
    throw new PersistError("Message conversation mismatch", 400);
  }
  if (!isParticipant(actor, conversation)) {
    throw new PersistError("Not a participant in this conversation");
  }
  const text = incoming.text?.trim().slice(0, 3900) ?? "";
  if (!text) throw new PersistError("Message is empty", 400);
  return {
    ...incoming,
    senderId: actor.id,
    senderRole: actor.role,
    text,
    sentAt: new Date().toISOString(),
  };
}

export function conversationReadField(
  actor: Actor,
  conversation: Conversation | null,
): "seekerLastReadAt" | "landlordLastReadAt" {
  if (!conversation) throw new PersistError("Conversation not found", 404);
  if (!isParticipant(actor, conversation)) {
    throw new PersistError("Not a participant in this conversation");
  }
  return actor.role === "SEEKER" ? "seekerLastReadAt" : "landlordLastReadAt";
}

export function counterpart(
  actor: Actor,
  seekerId: string,
  landlordId: string | null,
): Recipient | null {
  if (actor.role === "SEEKER") {
    return landlordId && landlordId !== actor.id
      ? { id: landlordId, role: "LANDLORD" }
      : null;
  }
  return seekerId !== actor.id ? { id: seekerId, role: "SEEKER" } : null;
}

/** Notifications can only target the counterpart of the record they accompany. */
export function sanitizeNotification(
  actor: Actor,
  incoming: Notification,
  recipient: Recipient,
  allowedConversationId: string | null,
): Notification {
  assertDocId(incoming.id, "notification");
  return {
    id: incoming.id,
    title: String(incoming.title ?? "").slice(0, 200),
    message: String(incoming.message ?? "").slice(0, 1000),
    channels: ["in_app"],
    read: false,
    createdAt: new Date().toISOString(),
    conversationId:
      incoming.conversationId && incoming.conversationId === allowedConversationId
        ? incoming.conversationId
        : undefined,
    seekerId: recipient.role === "SEEKER" ? recipient.id : undefined,
    landlordId: recipient.role === "LANDLORD" ? recipient.id : undefined,
    fromName: actor.name,
  };
}

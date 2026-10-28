import { NextResponse } from "next/server";
import {
  getApplication,
  getConversation,
  getListingOwnerId,
  getShowing,
  markConversationReadAt,
  markNotificationReadFor,
  saveApplication,
  saveConversation,
  saveMessage,
  saveNotification,
  saveShowing,
} from "@/lib/appwrite/data";
import { getSessionActor } from "@/lib/server/actor";
import {
  assertDocId,
  authorizeApplication,
  authorizeConversation,
  authorizeMessage,
  authorizeShowing,
  conversationReadField,
  counterpart,
  PersistError,
  sanitizeNotification,
  type Recipient,
} from "@/lib/server/authorize";
import type {
  Application,
  ChatMessage,
  Conversation,
  Notification,
  Showing,
} from "@/lib/types";

export const dynamic = "force-dynamic";

interface PersistBody {
  showing?: Showing;
  application?: Application;
  conversation?: Conversation;
  message?: ChatMessage;
  notification?: Notification;
  conversationRead?: { conversationId: string; readAt?: string };
  notificationRead?: string;
}

/**
 * Persists tenant/landlord actions. Identity and ownership come from the
 * session and the stored records, never from the request body.
 */
export async function POST(request: Request) {
  const actor = await getSessionActor();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as PersistBody;
    const result: Record<string, unknown> = {};
    let recipient: Recipient | null = null;
    let conversationForNotification: string | null = null;

    if (body.showing) {
      const existing = await getShowing(assertDocId(body.showing.id, "showing"));
      const listingId = existing?.listingId ?? body.showing.listingId;
      const ownerId = await getListingOwnerId(listingId);
      const showing = authorizeShowing(actor, { ...body.showing, listingId }, existing, ownerId);
      result.showing = await saveShowing(showing, ownerId);
      recipient = counterpart(actor, showing.seekerId, ownerId);
    }

    if (body.application) {
      const existing = await getApplication(assertDocId(body.application.id, "application"));
      const listingId = existing?.listingId ?? body.application.listingId;
      const ownerId = await getListingOwnerId(listingId);
      const showing = existing
        ? null
        : await getShowing(assertDocId(body.application.showingId, "showing"));
      const app = authorizeApplication(
        actor,
        { ...body.application, listingId },
        existing,
        ownerId,
        showing,
      );
      result.application = await saveApplication(app, ownerId);
      recipient ??= counterpart(actor, app.seekerId, ownerId);
    }

    if (body.conversation) {
      const existing = await getConversation(assertDocId(body.conversation.id, "conversation"));
      let ownerId: string | null = null;
      let linkedSeekerId: string | null = null;
      if (!existing) {
        ownerId = await getListingOwnerId(body.conversation.listingId);
        linkedSeekerId = await acceptedSeekerFor(body.conversation);
      }
      const conversation = authorizeConversation(
        actor,
        body.conversation,
        existing,
        ownerId,
        linkedSeekerId,
      );
      if (conversation) result.conversation = await saveConversation(conversation);
      conversationForNotification = body.conversation.id;
    }

    if (body.message) {
      const conversation = await getConversation(
        assertDocId(body.message.conversationId, "conversation"),
      );
      const message = authorizeMessage(actor, body.message, conversation);
      result.message = await saveMessage(message, conversation!);
      recipient ??= counterpart(actor, conversation!.seekerId, conversation!.landlordId);
      conversationForNotification = conversation!.id;
    }

    if (body.notification && recipient) {
      const notification = sanitizeNotification(
        actor,
        body.notification,
        recipient,
        conversationForNotification,
      );
      result.notification = await saveNotification(notification);
    }

    if (body.conversationRead) {
      const id = assertDocId(body.conversationRead.conversationId, "conversation");
      const field = conversationReadField(actor, await getConversation(id));
      const readAt = body.conversationRead.readAt ?? new Date().toISOString();
      await markConversationReadAt(id, field, readAt.slice(0, 64));
      result.conversationRead = true;
    }

    if (body.notificationRead) {
      const id = assertDocId(body.notificationRead, "notification");
      result.notificationRead = await markNotificationReadFor(id, actor.id);
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof PersistError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Persist failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function acceptedSeekerFor(conversation: Conversation): Promise<string | null> {
  if (conversation.applicationId) {
    const app = await getApplication(assertDocId(conversation.applicationId, "application"));
    if (
      app &&
      app.listingId === conversation.listingId &&
      (app.status === "ACCEPTED" || app.status === "LEASE_SIGNED")
    ) {
      return app.seekerId;
    }
  }
  if (conversation.showingId) {
    const showing = await getShowing(assertDocId(conversation.showingId, "showing"));
    if (showing && showing.listingId === conversation.listingId && showing.status === "ACCEPTED") {
      return showing.seekerId;
    }
  }
  return null;
}

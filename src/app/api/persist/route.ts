import { NextResponse } from "next/server";
import {
  saveApplication,
  saveConversation,
  saveMessage,
  saveShowing,
} from "@/lib/appwrite/data";
import { getSessionUser } from "@/lib/auth-server";
import type {
  Application,
  ChatMessage,
  Conversation,
  Showing,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      showing?: Showing;
      application?: Application;
      conversation?: Conversation;
      message?: ChatMessage;
    };

    const result: Record<string, unknown> = {};

    if (body.showing) {
      result.showing = await saveShowing(body.showing);
    }
    if (body.application) {
      result.application = await saveApplication(body.application);
    }
    if (body.conversation) {
      result.conversation = await saveConversation(body.conversation);
    }
    if (body.message) {
      result.message = await saveMessage(body.message);
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Persist failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

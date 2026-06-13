"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockLandlord, mockSeeker } from "@/lib/mock-data";
import { useDoorwayStore } from "@/lib/store";
import type { Conversation } from "@/lib/types";

interface MessagesPanelProps {
  role: "SEEKER" | "LANDLORD";
}

export function MessagesPanel({ role }: MessagesPanelProps) {
  const conversations = useDoorwayStore((s) => s.conversations);
  const messages = useDoorwayStore((s) => s.messages);
  const listings = useDoorwayStore((s) => s.listings);
  const sendMessage = useDoorwayStore((s) => s.sendMessage);
  const markConversationRead = useDoorwayStore((s) => s.markConversationRead);

  const myId = role === "SEEKER" ? mockSeeker.id : mockLandlord.id;
  const myConversations = conversations.filter((c) =>
    role === "SEEKER" ? c.seekerId === myId : c.landlordId === myId,
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const active = myConversations.find((c) => c.id === activeId);
  const thread = active
    ? messages
        .filter((m) => m.conversationId === active.id)
        .sort((a, b) => a.sentAt.localeCompare(b.sentAt))
    : [];

  const openConversation = (convo: Conversation) => {
    setActiveId(convo.id);
    markConversationRead(convo.id, role);
  };

  const handleSend = () => {
    if (!active || !draft.trim()) return;
    sendMessage(active.id, draft.trim(), role);
    setDraft("");
  };

  if (active) {
    const otherName = role === "SEEKER" ? active.landlordName : active.seekerName;

    return (
      <div className="flex flex-1 flex-col px-5 pb-4">
        <button
          type="button"
          onClick={() => setActiveId(null)}
          className="mb-3 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          ← All messages
        </button>

        <div className="mb-4 rounded-2xl border border-border bg-card px-4 py-3">
          <p className="font-medium">{otherName}</p>
          <p className="text-sm text-muted-foreground">{active.listingTitle}</p>
        </div>

        <div
          className="flex flex-1 flex-col gap-2 overflow-y-auto rounded-2xl bg-surface p-4"
          style={{ minHeight: "40dvh" }}
        >
          {thread.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              Say hello — messaging is open because the application was accepted.
            </p>
          ) : (
            thread.map((msg) => {
              const mine = msg.senderRole === role;
              return (
                <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      mine
                        ? "bg-foreground text-background"
                        : "border border-border bg-card"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <Input
            label="Message"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Message ${otherName}…`}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <Button
            variant="primary"
            size="md"
            className="mt-6 shrink-0 rounded-full"
            disabled={!draft.trim()}
            onClick={handleSend}
          >
            Send
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 px-5 py-4">
      {myConversations.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-[1.75rem] bg-surface px-8 py-16 text-center">
          <h2 className="font-serif text-[1.65rem]">No messages yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {role === "SEEKER"
              ? "After a landlord accepts your application, you can message them here."
              : "When you accept an application, a chat opens so you can coordinate with the tenant."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {myConversations.map((convo) => {
            const listing = listings.find((l) => l.id === convo.listingId);
            const lastMsg = messages
              .filter((m) => m.conversationId === convo.id)
              .sort((a, b) => b.sentAt.localeCompare(a.sentAt))[0];
            const otherName = role === "SEEKER" ? convo.landlordName : convo.seekerName;

            return (
              <li key={convo.id}>
                <button
                  type="button"
                  onClick={() => openConversation(convo)}
                  className="w-full rounded-2xl border border-border bg-card px-4 py-4 text-left transition-colors hover:border-foreground/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{otherName}</p>
                    <span className="text-xs text-muted-foreground">Chat</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {listing?.title ?? convo.listingTitle}
                  </p>
                  {lastMsg && (
                    <p className="mt-2 truncate text-sm text-muted-foreground">{lastMsg.text}</p>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

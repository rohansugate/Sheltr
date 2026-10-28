import type {
  Application,
  ChatMessage,
  Conversation,
  Listing,
  Notification,
  Showing,
} from "./types";

export interface PersistPayload {
  listing?: Listing;
  showing?: Showing;
  application?: Application;
  conversation?: Conversation;
  message?: ChatMessage;
  notification?: Notification;
  conversationRead?: { conversationId: string; readAt?: string };
  notificationRead?: string;
}

let persistEnabled = false;
const listeners = new Set<() => void>();

/** Enabled once a real Appwrite session is confirmed; demo mode stays local. */
export function setAppwritePersistEnabled(enabled: boolean) {
  if (persistEnabled === enabled) return;
  persistEnabled = enabled;
  listeners.forEach((listener) => listener());
}

export function subscribeAppwritePersist(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isAppwritePersistEnabled() {
  return persistEnabled;
}

/** Best-effort push of domain changes to Appwrite (logged-in users). */
export function persistToAppwrite(payload: PersistPayload) {
  if (typeof window === "undefined" || !persistEnabled) return;

  if (payload.listing) {
    void fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listing: payload.listing }),
    }).catch(() => null);
    return;
  }

  void fetch("/api/persist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => null);
}

export async function uploadListingPhoto(file: File): Promise<string | null> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/uploads", { method: "POST", body });
  if (!res.ok) return null;
  const data = await res.json();
  return typeof data.url === "string" ? data.url : null;
}

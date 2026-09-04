import type {
  Application,
  ChatMessage,
  Conversation,
  Listing,
  Showing,
} from "./types";

/** Best-effort push of domain objects to Appwrite (logged-in users). */
export function persistToAppwrite(payload: {
  listing?: Listing;
  showing?: Showing;
  application?: Application;
  conversation?: Conversation;
  message?: ChatMessage;
}) {
  if (typeof window === "undefined") return;

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

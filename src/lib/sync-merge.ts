import type {
  Application,
  ApplicationStatus,
  ChatMessage,
  Conversation,
  DemoSyncPayload,
  Listing,
  Notification,
  Showing,
  ShowingStatus,
} from "./types";

const APPLICATION_STATUS_RANK: Record<ApplicationStatus, number> = {
  SENT: 0,
  VIEWED: 1,
  ACCEPTED: 3,
  DECLINED: 2,
  INTERVIEW_SCHEDULED: 4,
  LEASE_SIGNED: 5,
};

const SHOWING_STATUS_RANK: Record<ShowingStatus, number> = {
  REQUESTED: 0,
  ACCEPTED: 2,
  DECLINED: 2,
};

function itemTimestamp(value?: string) {
  return value ? Date.parse(value) || 0 : 0;
}

function pickNewer<T extends { updatedAt?: string; createdAt?: string }>(
  current: T,
  candidate: T,
) {
  const currentTs = Math.max(
    itemTimestamp(current.updatedAt),
    itemTimestamp(current.createdAt),
  );
  const candidateTs = Math.max(
    itemTimestamp(candidate.updatedAt),
    itemTimestamp(candidate.createdAt),
  );
  return candidateTs >= currentTs ? candidate : current;
}

function mergeById<T extends { id: string }>(a: T[], b: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of a) map.set(item.id, item);
  for (const item of b) map.set(item.id, item);
  return Array.from(map.values());
}

function mergeApplications(a: Application[], b: Application[]): Application[] {
  const map = new Map<string, Application>();
  for (const app of [...a, ...b]) {
    const existing = map.get(app.id);
    if (!existing) {
      map.set(app.id, app);
      continue;
    }
    const existingRank = APPLICATION_STATUS_RANK[existing.status];
    const appRank = APPLICATION_STATUS_RANK[app.status];
    const keep =
      appRank > existingRank
        ? app
        : appRank < existingRank
          ? existing
          : pickNewer(existing, app);
    map.set(app.id, keep);
  }
  return Array.from(map.values());
}

function mergeShowings(a: Showing[], b: Showing[]): Showing[] {
  const map = new Map<string, Showing>();
  for (const showing of [...a, ...b]) {
    const existing = map.get(showing.id);
    if (!existing) {
      map.set(showing.id, showing);
      continue;
    }
    const existingRank = SHOWING_STATUS_RANK[existing.status];
    const showingRank = SHOWING_STATUS_RANK[showing.status];
    const keep =
      showingRank > existingRank
        ? showing
        : showingRank < existingRank
          ? existing
          : pickNewer(existing, showing);
    map.set(showing.id, keep);
  }
  return Array.from(map.values());
}

function mergeNotifications(a: Notification[], b: Notification[]): Notification[] {
  const map = new Map<string, Notification>();
  for (const notification of [...a, ...b]) {
    const existing = map.get(notification.id);
    if (!existing) {
      map.set(notification.id, notification);
      continue;
    }
    map.set(
      notification.id,
      pickNewer(
        { ...existing, createdAt: existing.createdAt },
        { ...notification, createdAt: notification.createdAt },
      ),
    );
  }
  return Array.from(map.values()).sort((x, y) =>
    y.createdAt.localeCompare(x.createdAt),
  );
}

function mergeListings(a: Listing[], b: Listing[]): Listing[] {
  const map = new Map<string, Listing>();
  for (const listing of [...a, ...b]) {
    const existing = map.get(listing.id);
    if (!existing) {
      map.set(listing.id, listing);
      continue;
    }
    const keep = pickNewer(
      { ...existing, updatedAt: existing.updatedAt },
      { ...listing, updatedAt: listing.updatedAt },
    );
    map.set(listing.id, {
      ...existing,
      ...listing,
      ...keep,
      analytics: {
        views: Math.max(existing.analytics.views, listing.analytics.views),
        saves: Math.max(existing.analytics.saves, listing.analytics.saves),
        applications: Math.max(
          existing.analytics.applications,
          listing.analytics.applications,
        ),
      },
    });
  }
  return Array.from(map.values());
}

function mergeMessages(a: ChatMessage[], b: ChatMessage[]): ChatMessage[] {
  return mergeById(a, b).sort((x, y) => x.sentAt.localeCompare(y.sentAt));
}

/** Demo listings to purge from sync and local storage. */
export function isBlockedListingTitle(title: string): boolean {
  const normalized = title.trim().toLowerCase();
  return (
    normalized === "ruddy tyrone" ||
    normalized === "tyrone" ||
    normalized.includes("ruddy tyrone")
  );
}

function blockedListingIds(listings: Listing[] | undefined): Set<string> {
  return new Set(
    (listings ?? [])
      .filter((l) => isBlockedListingTitle(l.title))
      .map((l) => l.id),
  );
}

function emptyDemoPayload(updatedAt?: string): DemoSyncPayload {
  return {
    listings: [],
    applications: [],
    showings: [],
    conversations: [],
    messages: [],
    notifications: [],
    updatedAt: updatedAt ?? new Date().toISOString(),
  };
}

/** Normalize partial sync payloads from older clients or bad POSTs. */
export function normalizeDemoPayload(
  payload: Partial<DemoSyncPayload> | null | undefined,
): DemoSyncPayload {
  const base = emptyDemoPayload(payload?.updatedAt);
  if (!payload) return base;
  return {
    listings: payload.listings ?? base.listings,
    applications: payload.applications ?? base.applications,
    showings: payload.showings ?? base.showings,
    conversations: payload.conversations ?? base.conversations,
    messages: payload.messages ?? base.messages,
    notifications: payload.notifications ?? base.notifications,
    updatedAt: payload.updatedAt ?? base.updatedAt,
  };
}

/** Remove blocked listings and related applications, showings, and messages. */
export function sanitizeDemoPayload(payload: DemoSyncPayload): DemoSyncPayload {
  const normalized = normalizeDemoPayload(payload);
  const removed = blockedListingIds(normalized.listings);
  if (removed.size === 0) return normalized;

  const listings = normalized.listings.filter((l) => !removed.has(l.id));
  const conversations = normalized.conversations.filter(
    (c) => !removed.has(c.listingId),
  );
  const conversationIds = new Set(conversations.map((c) => c.id));

  return {
    ...normalized,
    listings,
    applications: normalized.applications.filter((a) => !removed.has(a.listingId)),
    showings: normalized.showings.filter((s) => !removed.has(s.listingId)),
    conversations,
    messages: normalized.messages.filter((m) =>
      conversationIds.has(m.conversationId),
    ),
  };
}

/** Combine two sync snapshots — used on server write and client pull. */
export function mergeDemoPayload(
  base: DemoSyncPayload | null,
  incoming: DemoSyncPayload,
): DemoSyncPayload {
  const next = normalizeDemoPayload(incoming);

  if (!base) {
    return sanitizeDemoPayload({
      ...next,
      updatedAt: new Date().toISOString(),
    });
  }

  const current = normalizeDemoPayload(base);

  return sanitizeDemoPayload({
    listings: mergeListings(current.listings, next.listings),
    applications: mergeApplications(current.applications, next.applications),
    showings: mergeShowings(current.showings, next.showings),
    conversations: mergeById(current.conversations, next.conversations),
    messages: mergeMessages(current.messages, next.messages),
    notifications: mergeNotifications(current.notifications, next.notifications),
    updatedAt: new Date().toISOString(),
  });
}

export function localStateToSyncPayload(state: {
  listings: Listing[];
  applications: Application[];
  showings: Showing[];
  conversations: Conversation[];
  messages: ChatMessage[];
  notifications: Notification[];
}): DemoSyncPayload {
  return {
    ...state,
    updatedAt: new Date().toISOString(),
  };
}

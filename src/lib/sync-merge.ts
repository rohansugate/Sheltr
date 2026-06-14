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
  for (const listing of a) map.set(listing.id, listing);
  for (const listing of b) {
    const existing = map.get(listing.id);
    if (!existing) {
      map.set(listing.id, listing);
      continue;
    }
    map.set(listing.id, {
      ...existing,
      ...listing,
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

/** Combine two sync snapshots — used on server write and client pull. */
export function mergeDemoPayload(
  base: DemoSyncPayload | null,
  incoming: DemoSyncPayload,
): DemoSyncPayload {
  if (!base) {
    return { ...incoming, updatedAt: new Date().toISOString() };
  }

  return {
    listings: mergeListings(base.listings, incoming.listings),
    applications: mergeApplications(base.applications, incoming.applications),
    showings: mergeShowings(base.showings, incoming.showings),
    conversations: mergeById(base.conversations, incoming.conversations),
    messages: mergeMessages(base.messages, incoming.messages),
    notifications: mergeNotifications(base.notifications, incoming.notifications),
    updatedAt: new Date().toISOString(),
  };
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

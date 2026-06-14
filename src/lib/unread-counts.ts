import { resolveLandlord, resolveSeeker } from "./current-user";
import { notificationBelongsToUser } from "./notifications";
import type {
  Application,
  ChatMessage,
  Conversation,
  Listing,
  Notification,
  Showing,
  User,
  UserRole,
} from "./types";

export function conversationForUser(
  convo: Conversation,
  role: "SEEKER" | "LANDLORD",
  myId: string,
  listings: Pick<Listing, "id" | "landlordId">[],
) {
  if (role === "SEEKER") return convo.seekerId === myId;
  if (convo.landlordId === myId) return true;
  const listing = listings.find((l) => l.id === convo.listingId);
  return listing?.landlordId === myId;
}

function lastReadAt(conversation: Conversation, role: "SEEKER" | "LANDLORD") {
  return role === "SEEKER"
    ? conversation.seekerLastReadAt
    : conversation.landlordLastReadAt;
}

export function countUnreadInConversation(
  conversation: Conversation,
  messages: ChatMessage[],
  role: "SEEKER" | "LANDLORD",
) {
  const readThrough = lastReadAt(conversation, role) ?? "";
  return messages.filter(
    (m) =>
      m.conversationId === conversation.id &&
      m.senderRole !== role &&
      m.sentAt > readThrough,
  ).length;
}

export function countUnreadMessages(
  conversations: Conversation[],
  messages: ChatMessage[],
  listings: Pick<Listing, "id" | "landlordId">[],
  role: "SEEKER" | "LANDLORD",
  currentUser: User | null,
) {
  const myId =
    role === "SEEKER"
      ? resolveSeeker(currentUser).id
      : resolveLandlord(currentUser).id;

  return conversations
    .filter((c) => conversationForUser(c, role, myId, listings))
    .reduce(
      (total, conversation) =>
        total + countUnreadInConversation(conversation, messages, role),
      0,
    );
}

export function getLandlordListingIds(
  landlordId: string,
  listings: Pick<Listing, "id" | "landlordId">[],
) {
  return new Set(
    listings.filter((l) => l.landlordId === landlordId).map((l) => l.id),
  );
}

export function countUnreadLandlordApplications(
  applications: Application[],
  showings: Showing[],
  listingIds: Set<string>,
  seenApplicationIds: string[],
  seenShowingIds: string[],
) {
  const seenApps = new Set(seenApplicationIds);
  const seenShowings = new Set(seenShowingIds);

  const unseenApps = applications.filter(
    (a) =>
      listingIds.has(a.listingId) &&
      a.status === "SENT" &&
      !seenApps.has(a.id),
  ).length;

  const unseenShowings = showings.filter(
    (s) =>
      listingIds.has(s.listingId) &&
      s.status === "REQUESTED" &&
      !seenShowings.has(s.id),
  ).length;

  return unseenApps + unseenShowings;
}

export function countUnreadSeekerApplicationUpdates(
  applications: Application[],
  showings: Showing[],
  seekerId: string,
  seenApplicationIds: string[],
  seenShowingIds: string[],
) {
  const seenApps = new Set(seenApplicationIds);
  const seenShowings = new Set(seenShowingIds);

  const unseenShowings = showings.filter(
    (s) =>
      s.seekerId === seekerId &&
      (s.status === "ACCEPTED" || s.status === "DECLINED") &&
      !seenShowings.has(s.id),
  ).length;

  const unseenApps = applications.filter(
    (a) =>
      a.seekerId === seekerId &&
      (a.status === "ACCEPTED" || a.status === "DECLINED") &&
      !seenApps.has(a.id),
  ).length;

  return unseenShowings + unseenApps;
}

export function markLandlordApplicationNotificationsRead(
  notifications: Notification[],
  landlordId: string,
) {
  return notifications.map((n) => {
    if (n.read || n.landlordId !== landlordId || n.conversationId) return n;
    const title = n.title.toLowerCase();
    if (title.includes("application") || title.includes("showing")) {
      return { ...n, read: true };
    }
    return n;
  });
}

export function markConversationNotificationsRead(
  notifications: Notification[],
  conversationId: string,
  role: "SEEKER" | "LANDLORD",
  userId: string,
) {
  return notifications.map((n) => {
    if (n.conversationId !== conversationId) return n;
    if (!notificationBelongsToUser(n, role, userId)) return n;
    return { ...n, read: true };
  });
}

export function resolveMyId(role: UserRole, currentUser: User | null) {
  return role === "SEEKER"
    ? resolveSeeker(currentUser).id
    : resolveLandlord(currentUser).id;
}

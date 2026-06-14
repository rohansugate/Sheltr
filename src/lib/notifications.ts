import { resolveLandlord, resolveSeeker } from "./current-user";
import type { Notification, User, UserRole } from "./types";

export function notificationRecipientId(
  notification: Notification,
  role: "SEEKER" | "LANDLORD",
) {
  return role === "SEEKER" ? notification.seekerId : notification.landlordId;
}

export function notificationBelongsToUser(
  notification: Notification,
  role: "SEEKER" | "LANDLORD" | null,
  userId: string,
) {
  if (!role || (role !== "SEEKER" && role !== "LANDLORD")) return false;

  const recipientId = notificationRecipientId(notification, role);
  if (!recipientId) return false;
  return recipientId === userId;
}

export function filterNotificationsForUser(
  notifications: Notification[],
  role: UserRole | null,
  currentUser: User | null,
) {
  if (!role || (role !== "SEEKER" && role !== "LANDLORD")) return [];

  const userId =
    role === "SEEKER"
      ? resolveSeeker(currentUser).id
      : resolveLandlord(currentUser).id;

  return notifications.filter((n) =>
    notificationBelongsToUser(n, role, userId),
  );
}

export function messagesHref(
  role: "SEEKER" | "LANDLORD",
  conversationId?: string,
) {
  const base = role === "LANDLORD" ? "/landlord/messages" : "/messages";
  return conversationId ? `${base}?conversationId=${conversationId}` : base;
}

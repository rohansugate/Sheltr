import { ID, Permission, Query, Role } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import { createAdminClient } from "./admin";
import { APPWRITE, getAppwriteEndpoint, getAppwriteProjectId } from "./config";
import type {
  Application,
  ChatMessage,
  Conversation,
  Listing,
  Notification,
  Showing,
  UserSyncPayload,
} from "../types";
import type { Actor } from "../server/authorize";

type Doc = Record<string, unknown> & { $id: string; $createdAt?: string; $updatedAt?: string };

function fileViewUrl(fileId: string) {
  const endpoint = getAppwriteEndpoint();
  const project = getAppwriteProjectId();
  return `${endpoint}/storage/buckets/${APPWRITE.bucketId}/files/${fileId}/view?project=${project}`;
}

export function docToListing(doc: Doc): Listing {
  return {
    id: doc.$id,
    landlordId: String(doc.landlordId ?? ""),
    title: String(doc.title ?? ""),
    monthlyRent: Number(doc.monthlyRent ?? 0),
    bedrooms: Number(doc.bedrooms ?? 1),
    bathrooms: Number(doc.bathrooms ?? 1),
    images: Array.isArray(doc.images) ? doc.images.map(String) : [],
    isSection8Approved: Boolean(doc.isSection8Approved),
    isGroundFloor: Boolean(doc.isGroundFloor),
    zipCode: String(doc.zipCode ?? ""),
    neighborhood: doc.neighborhood ? String(doc.neighborhood) : undefined,
    transitLines: Array.isArray(doc.transitLines) ? doc.transitLines.map(String) : [],
    landlordVerified: Boolean(doc.landlordVerified),
    latitude: Number(doc.latitude ?? 0),
    longitude: Number(doc.longitude ?? 0),
    source: (doc.source as Listing["source"]) ?? "MANUAL",
    status: (doc.status as Listing["status"]) ?? "ACTIVE",
    analytics: {
      views: Number(doc.views ?? 0),
      saves: Number(doc.saves ?? 0),
      applications: Number(doc.applicationsCount ?? 0),
    },
    sourceUrl: doc.sourceUrl ? String(doc.sourceUrl) : undefined,
    utilitiesIncluded: doc.utilitiesIncluded
      ? String(doc.utilitiesIncluded)
      : undefined,
    availableDate: doc.availableDate ? String(doc.availableDate) : undefined,
    petsAllowed:
      typeof doc.petsAllowed === "boolean" ? doc.petsAllowed : undefined,
    updatedAt: doc.$updatedAt,
  };
}

function listingPermissions(landlordId: string) {
  return [
    Permission.read(Role.any()),
    Permission.update(Role.user(landlordId)),
    Permission.delete(Role.user(landlordId)),
  ];
}

export async function listActiveListings(limit = 100): Promise<Listing[]> {
  const { databases } = createAdminClient();
  const result = await databases.listDocuments({
    databaseId: APPWRITE.databaseId,
    collectionId: APPWRITE.collections.listings,
    queries: [
      Query.equal("status", "ACTIVE"),
      Query.limit(limit),
      Query.orderDesc("$updatedAt"),
    ],
  });
  return (result.documents as Doc[]).map(docToListing);
}

export async function listListingsByLandlord(landlordId: string): Promise<Listing[]> {
  const { databases } = createAdminClient();
  const result = await databases.listDocuments({
    databaseId: APPWRITE.databaseId,
    collectionId: APPWRITE.collections.listings,
    queries: [Query.equal("landlordId", landlordId), Query.limit(100)],
  });
  return (result.documents as Doc[]).map(docToListing);
}

export async function upsertListingDocument(
  listing: Listing,
): Promise<Listing> {
  const { databases } = createAdminClient();
  const data = {
    landlordId: listing.landlordId ?? "",
    title: listing.title,
    monthlyRent: listing.monthlyRent,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    zipCode: listing.zipCode,
    neighborhood: listing.neighborhood ?? "",
    isSection8Approved: listing.isSection8Approved,
    isGroundFloor: listing.isGroundFloor,
    landlordVerified: listing.landlordVerified,
    latitude: listing.latitude,
    longitude: listing.longitude,
    images: listing.images.slice(0, 5),
    transitLines: listing.transitLines.slice(0, 8),
    source: listing.source,
    status: listing.status,
    sourceUrl: listing.sourceUrl ?? "",
    utilitiesIncluded: listing.utilitiesIncluded ?? "",
    availableDate: listing.availableDate ?? "",
    petsAllowed: listing.petsAllowed ?? false,
    views: listing.analytics.views,
    saves: listing.analytics.saves,
    applicationsCount: listing.analytics.applications,
  };

  const permissions = listing.landlordId
    ? listingPermissions(listing.landlordId)
    : [Permission.read(Role.any())];

  try {
    const doc = (await databases.getDocument({
      databaseId: APPWRITE.databaseId,
      collectionId: APPWRITE.collections.listings,
      documentId: listing.id,
    })) as Doc;
    const updated = (await databases.updateDocument({
      databaseId: APPWRITE.databaseId,
      collectionId: APPWRITE.collections.listings,
      documentId: doc.$id,
      data,
      permissions,
    })) as Doc;
    return docToListing(updated);
  } catch {
    const created = (await databases.createDocument({
      databaseId: APPWRITE.databaseId,
      collectionId: APPWRITE.collections.listings,
      documentId: listing.id || ID.unique(),
      data,
      permissions,
    })) as Doc;
    return docToListing(created);
  }
}

export async function uploadListingImage(params: {
  landlordId: string;
  filename: string;
  bytes: Buffer;
  contentType: string;
}): Promise<string> {
  const { storage } = createAdminClient();
  const file = InputFile.fromBuffer(params.bytes, params.filename);
  const created = await storage.createFile({
    bucketId: APPWRITE.bucketId,
    fileId: ID.unique(),
    file,
    permissions: [
      Permission.read(Role.any()),
      Permission.update(Role.user(params.landlordId)),
      Permission.delete(Role.user(params.landlordId)),
    ],
  });
  return fileViewUrl(created.$id);
}

type DomainCollection = Exclude<keyof typeof APPWRITE.collections, "listings">;

function isNotFound(err: unknown) {
  return (err as { code?: number })?.code === 404;
}

async function getDoc(collection: keyof typeof APPWRITE.collections, id: string) {
  const { databases } = createAdminClient();
  try {
    return (await databases.getDocument({
      databaseId: APPWRITE.databaseId,
      collectionId: APPWRITE.collections[collection],
      documentId: id,
    })) as Doc;
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

async function upsertDoc(
  collection: DomainCollection,
  id: string,
  data: Record<string, unknown>,
  permissions: string[],
) {
  const { databases } = createAdminClient();
  const params = {
    databaseId: APPWRITE.databaseId,
    collectionId: APPWRITE.collections[collection],
    documentId: id,
    data,
    permissions,
  };
  try {
    return (await databases.updateDocument(params)) as Doc;
  } catch (err) {
    if (!isNotFound(err)) throw err;
    return (await databases.createDocument(params)) as Doc;
  }
}

async function listAll(
  collection: DomainCollection,
  field: string,
  values: string[],
  extra: string[] = [],
): Promise<Doc[]> {
  if (values.length === 0) return [];
  const { databases } = createAdminClient();
  const docs: Doc[] = [];
  for (let i = 0; i < values.length; i += 100) {
    const result = await databases.listDocuments({
      databaseId: APPWRITE.databaseId,
      collectionId: APPWRITE.collections[collection],
      queries: [Query.equal(field, values.slice(i, i + 100)), Query.limit(500), ...extra],
    });
    docs.push(...(result.documents as Doc[]));
  }
  return docs;
}

/** Read-only access for the people involved; all writes go through the server. */
export function participantPermissions(...userIds: (string | null | undefined)[]) {
  return [...new Set(userIds.filter((id): id is string => Boolean(id)))].map((id) =>
    Permission.read(Role.user(id)),
  );
}

export async function getListingOwnerId(listingId: string): Promise<string | null> {
  const doc = await getDoc("listings", listingId);
  return doc ? String(doc.landlordId ?? "") || null : null;
}

function docToShowing(doc: Doc): Showing {
  return {
    id: doc.$id,
    listingId: String(doc.listingId),
    seekerId: String(doc.seekerId),
    seekerName: String(doc.seekerName),
    date: String(doc.date),
    time: String(doc.time),
    contactMethod: doc.contactMethod as Showing["contactMethod"],
    contactValue: String(doc.contactValue),
    status: doc.status as Showing["status"],
    landlordMessage: doc.landlordMessage ? String(doc.landlordMessage) : undefined,
    createdAt: doc.$createdAt ?? new Date().toISOString(),
    updatedAt: doc.$updatedAt,
  };
}

function docToApplication(doc: Doc): Application {
  let packet: Application["packet"] = {
    voucherSize: 1,
    maxRent: 0,
    voucherCaseNumber: "",
    employment: "",
    references: "",
  };
  try {
    packet = { ...packet, ...JSON.parse(String(doc.packetJson ?? "{}")) };
  } catch {
    // keep defaults
  }
  return {
    id: doc.$id,
    listingId: String(doc.listingId),
    showingId: String(doc.showingId),
    seekerId: String(doc.seekerId),
    seekerName: String(doc.seekerName),
    packet,
    status: doc.status as Application["status"],
    sentAt: String(doc.sentAt ?? doc.$createdAt ?? new Date().toISOString()),
    updatedAt: doc.$updatedAt,
  };
}

function docToConversation(doc: Doc): Conversation {
  return {
    id: doc.$id,
    listingId: String(doc.listingId),
    listingTitle: String(doc.listingTitle),
    seekerId: String(doc.seekerId),
    seekerName: String(doc.seekerName),
    landlordId: String(doc.landlordId),
    landlordName: String(doc.landlordName),
    applicationId: doc.applicationId ? String(doc.applicationId) : undefined,
    showingId: doc.showingId ? String(doc.showingId) : undefined,
    seekerLastReadAt: doc.seekerLastReadAt ? String(doc.seekerLastReadAt) : undefined,
    landlordLastReadAt: doc.landlordLastReadAt ? String(doc.landlordLastReadAt) : undefined,
    createdAt: doc.$createdAt ?? new Date().toISOString(),
  };
}

function docToMessage(doc: Doc): ChatMessage {
  return {
    id: doc.$id,
    conversationId: String(doc.conversationId),
    senderId: String(doc.senderId),
    senderRole: doc.senderRole as ChatMessage["senderRole"],
    text: String(doc.text),
    sentAt: String(doc.sentAt ?? doc.$createdAt ?? new Date().toISOString()),
  };
}

function docToNotification(doc: Doc): Notification {
  const recipientId = String(doc.recipientId);
  const isSeeker = doc.recipientRole === "SEEKER";
  return {
    id: doc.$id,
    title: String(doc.title ?? ""),
    message: String(doc.message ?? ""),
    channels: ["in_app"],
    read: Boolean(doc.read),
    createdAt: String(doc.createdAt ?? doc.$createdAt ?? new Date().toISOString()),
    conversationId: doc.conversationId ? String(doc.conversationId) : undefined,
    seekerId: isSeeker ? recipientId : undefined,
    landlordId: isSeeker ? undefined : recipientId,
    fromName: doc.fromName ? String(doc.fromName) : undefined,
  };
}

export async function getShowing(id: string) {
  const doc = await getDoc("showings", id);
  return doc ? docToShowing(doc) : null;
}

export async function getApplication(id: string) {
  const doc = await getDoc("applications", id);
  return doc ? docToApplication(doc) : null;
}

export async function getConversation(id: string) {
  const doc = await getDoc("conversations", id);
  return doc ? docToConversation(doc) : null;
}

export async function saveShowing(showing: Showing, landlordId: string | null) {
  const doc = await upsertDoc(
    "showings",
    showing.id,
    {
      listingId: showing.listingId,
      seekerId: showing.seekerId,
      seekerName: showing.seekerName,
      date: showing.date,
      time: showing.time,
      contactMethod: showing.contactMethod,
      contactValue: showing.contactValue,
      status: showing.status,
      landlordMessage: showing.landlordMessage ?? "",
    },
    participantPermissions(showing.seekerId, landlordId),
  );
  return docToShowing(doc);
}

export async function saveApplication(app: Application, landlordId: string | null) {
  const doc = await upsertDoc(
    "applications",
    app.id,
    {
      listingId: app.listingId,
      showingId: app.showingId,
      seekerId: app.seekerId,
      seekerName: app.seekerName,
      packetJson: JSON.stringify(app.packet).slice(0, 1900),
      status: app.status,
      sentAt: app.sentAt,
    },
    participantPermissions(app.seekerId, landlordId),
  );
  return docToApplication(doc);
}

export async function saveConversation(conversation: Conversation) {
  const doc = await upsertDoc(
    "conversations",
    conversation.id,
    {
      listingId: conversation.listingId,
      listingTitle: conversation.listingTitle.slice(0, 256),
      seekerId: conversation.seekerId,
      seekerName: conversation.seekerName.slice(0, 128),
      landlordId: conversation.landlordId,
      landlordName: conversation.landlordName.slice(0, 128),
      applicationId: conversation.applicationId ?? "",
      showingId: conversation.showingId ?? "",
    },
    participantPermissions(conversation.seekerId, conversation.landlordId),
  );
  return docToConversation(doc);
}

export async function markConversationReadAt(
  conversationId: string,
  field: "seekerLastReadAt" | "landlordLastReadAt",
  readAt: string,
) {
  const { databases } = createAdminClient();
  await databases.updateDocument({
    databaseId: APPWRITE.databaseId,
    collectionId: APPWRITE.collections.conversations,
    documentId: conversationId,
    data: { [field]: readAt },
  });
}

export async function saveMessage(message: ChatMessage, conversation: Conversation) {
  const doc = await upsertDoc(
    "messages",
    message.id,
    {
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderRole: message.senderRole,
      text: message.text,
      sentAt: message.sentAt,
    },
    participantPermissions(conversation.seekerId, conversation.landlordId),
  );
  return docToMessage(doc);
}

export async function saveNotification(notification: Notification) {
  const recipientId = notification.seekerId ?? notification.landlordId;
  if (!recipientId) return null;
  const doc = await upsertDoc(
    "notifications",
    notification.id,
    {
      recipientId,
      recipientRole: notification.seekerId ? "SEEKER" : "LANDLORD",
      title: notification.title,
      message: notification.message,
      conversationId: notification.conversationId ?? "",
      fromName: notification.fromName ?? "",
      read: false,
      createdAt: notification.createdAt,
    },
    participantPermissions(recipientId),
  );
  return docToNotification(doc);
}

export async function markNotificationReadFor(id: string, userId: string) {
  const doc = await getDoc("notifications", id);
  if (!doc || String(doc.recipientId) !== userId) return false;
  const { databases } = createAdminClient();
  await databases.updateDocument({
    databaseId: APPWRITE.databaseId,
    collectionId: APPWRITE.collections.notifications,
    documentId: id,
    data: { read: true },
  });
  return true;
}

export type UserDomainData = UserSyncPayload;

/** Only the records the signed-in user is a party to. */
export async function listDomainForUser(actor: Actor): Promise<UserDomainData> {
  const newestFirst = [Query.orderDesc("$createdAt")];
  let showingDocs: Doc[];
  let applicationDocs: Doc[];

  if (actor.role === "SEEKER") {
    [showingDocs, applicationDocs] = await Promise.all([
      listAll("showings", "seekerId", [actor.id], newestFirst),
      listAll("applications", "seekerId", [actor.id], newestFirst),
    ]);
  } else {
    const ownListingIds = (await listListingsByLandlord(actor.id)).map((l) => l.id);
    [showingDocs, applicationDocs] = await Promise.all([
      listAll("showings", "listingId", ownListingIds, newestFirst),
      listAll("applications", "listingId", ownListingIds, newestFirst),
    ]);
  }

  const [conversationDocs, notificationDocs] = await Promise.all([
    listAll(
      "conversations",
      actor.role === "SEEKER" ? "seekerId" : "landlordId",
      [actor.id],
      newestFirst,
    ),
    listAll("notifications", "recipientId", [actor.id], newestFirst),
  ]);
  const conversations = conversationDocs.map(docToConversation);
  const messageDocs = await listAll(
    "messages",
    "conversationId",
    conversations.map((c) => c.id),
    [Query.orderAsc("sentAt")],
  );

  return {
    showings: showingDocs.map(docToShowing),
    applications: applicationDocs.map(docToApplication),
    conversations,
    messages: messageDocs.map(docToMessage),
    notifications: notificationDocs
      .filter((d) => d.recipientRole === actor.role)
      .map(docToNotification),
  };
}

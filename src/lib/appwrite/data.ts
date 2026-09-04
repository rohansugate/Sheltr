import { ID, Permission, Query, Role } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import { createAdminClient } from "./admin";
import { APPWRITE, getAppwriteEndpoint, getAppwriteProjectId } from "./config";
import type {
  Application,
  ChatMessage,
  Conversation,
  Listing,
  Showing,
} from "../types";

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

export async function saveShowing(showing: Showing): Promise<Showing> {
  const { databases } = createAdminClient();
  const data = {
    listingId: showing.listingId,
    seekerId: showing.seekerId,
    seekerName: showing.seekerName,
    date: showing.date,
    time: showing.time,
    contactMethod: showing.contactMethod,
    contactValue: showing.contactValue,
    status: showing.status,
    landlordMessage: showing.landlordMessage ?? "",
  };
  const doc = (await databases.createDocument({
    databaseId: APPWRITE.databaseId,
    collectionId: APPWRITE.collections.showings,
    documentId: showing.id || ID.unique(),
    data,
    permissions: [
      Permission.read(Role.user(showing.seekerId)),
      Permission.update(Role.user(showing.seekerId)),
      Permission.read(Role.users()),
      Permission.update(Role.users()),
    ],
  })) as Doc;

  return {
    ...showing,
    id: doc.$id,
    createdAt: doc.$createdAt ?? showing.createdAt,
  };
}

export async function saveApplication(app: Application): Promise<Application> {
  const { databases } = createAdminClient();
  const data = {
    listingId: app.listingId,
    showingId: app.showingId,
    seekerId: app.seekerId,
    seekerName: app.seekerName,
    packetJson: JSON.stringify(app.packet).slice(0, 1900),
    status: app.status,
    sentAt: app.sentAt,
  };
  const doc = (await databases.createDocument({
    databaseId: APPWRITE.databaseId,
    collectionId: APPWRITE.collections.applications,
    documentId: app.id || ID.unique(),
    data,
    permissions: [
      Permission.read(Role.user(app.seekerId)),
      Permission.update(Role.user(app.seekerId)),
      Permission.read(Role.users()),
      Permission.update(Role.users()),
    ],
  })) as Doc;
  return { ...app, id: doc.$id };
}

export async function saveConversation(
  conversation: Conversation,
): Promise<Conversation> {
  const { databases } = createAdminClient();
  const data = {
    listingId: conversation.listingId,
    listingTitle: conversation.listingTitle,
    seekerId: conversation.seekerId,
    seekerName: conversation.seekerName,
    landlordId: conversation.landlordId,
    landlordName: conversation.landlordName,
    applicationId: conversation.applicationId ?? "",
    showingId: conversation.showingId ?? "",
  };
  const doc = (await databases.createDocument({
    databaseId: APPWRITE.databaseId,
    collectionId: APPWRITE.collections.conversations,
    documentId: conversation.id || ID.unique(),
    data,
    permissions: [
      Permission.read(Role.user(conversation.seekerId)),
      Permission.update(Role.user(conversation.seekerId)),
      Permission.read(Role.user(conversation.landlordId)),
      Permission.update(Role.user(conversation.landlordId)),
    ],
  })) as Doc;
  return { ...conversation, id: doc.$id };
}

export async function saveMessage(message: ChatMessage): Promise<ChatMessage> {
  const { databases } = createAdminClient();
  const data = {
    conversationId: message.conversationId,
    senderId: message.senderId,
    senderRole: message.senderRole,
    text: message.text.slice(0, 3900),
    sentAt: message.sentAt,
  };
  const doc = (await databases.createDocument({
    databaseId: APPWRITE.databaseId,
    collectionId: APPWRITE.collections.messages,
    documentId: message.id || ID.unique(),
    data,
    permissions: [Permission.read(Role.users()), Permission.update(Role.user(message.senderId))],
  })) as Doc;
  return { ...message, id: doc.$id };
}

export async function listShowings(): Promise<Showing[]> {
  const { databases } = createAdminClient();
  const result = await databases.listDocuments({
    databaseId: APPWRITE.databaseId,
    collectionId: APPWRITE.collections.showings,
    queries: [Query.limit(200), Query.orderDesc("$createdAt")],
  });
  return (result.documents as Doc[]).map((doc) => ({
    id: doc.$id,
    listingId: String(doc.listingId),
    seekerId: String(doc.seekerId),
    seekerName: String(doc.seekerName),
    date: String(doc.date),
    time: String(doc.time),
    contactMethod: doc.contactMethod as Showing["contactMethod"],
    contactValue: String(doc.contactValue),
    status: doc.status as Showing["status"],
    landlordMessage: doc.landlordMessage
      ? String(doc.landlordMessage)
      : undefined,
    createdAt: doc.$createdAt ?? new Date().toISOString(),
  }));
}

export async function listApplications(): Promise<Application[]> {
  const { databases } = createAdminClient();
  const result = await databases.listDocuments({
    databaseId: APPWRITE.databaseId,
    collectionId: APPWRITE.collections.applications,
    queries: [Query.limit(200), Query.orderDesc("$createdAt")],
  });
  return (result.documents as Doc[]).map((doc) => {
    let packet = {
      voucherSize: 1,
      maxRent: 0,
      voucherCaseNumber: "",
      employment: "",
      references: "",
    };
    try {
      packet = { ...packet, ...JSON.parse(String(doc.packetJson ?? "{}")) };
    } catch {
      // ignore
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
    };
  });
}

export async function listConversations(): Promise<Conversation[]> {
  const { databases } = createAdminClient();
  const result = await databases.listDocuments({
    databaseId: APPWRITE.databaseId,
    collectionId: APPWRITE.collections.conversations,
    queries: [Query.limit(200), Query.orderDesc("$createdAt")],
  });
  return (result.documents as Doc[]).map((doc) => ({
    id: doc.$id,
    listingId: String(doc.listingId),
    listingTitle: String(doc.listingTitle),
    seekerId: String(doc.seekerId),
    seekerName: String(doc.seekerName),
    landlordId: String(doc.landlordId),
    landlordName: String(doc.landlordName),
    applicationId: doc.applicationId ? String(doc.applicationId) : undefined,
    showingId: doc.showingId ? String(doc.showingId) : undefined,
    createdAt: doc.$createdAt ?? new Date().toISOString(),
  }));
}

export async function listMessages(): Promise<ChatMessage[]> {
  const { databases } = createAdminClient();
  const result = await databases.listDocuments({
    databaseId: APPWRITE.databaseId,
    collectionId: APPWRITE.collections.messages,
    queries: [Query.limit(500), Query.orderAsc("sentAt")],
  });
  return (result.documents as Doc[]).map((doc) => ({
    id: doc.$id,
    conversationId: String(doc.conversationId),
    senderId: String(doc.senderId),
    senderRole: doc.senderRole as ChatMessage["senderRole"],
    text: String(doc.text),
    sentAt: String(doc.sentAt ?? doc.$createdAt ?? new Date().toISOString()),
  }));
}

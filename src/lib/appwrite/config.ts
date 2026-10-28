/** Shared Appwrite resource IDs for Sheltr. */
export const APPWRITE = {
  databaseId: "sheltr",
  bucketId: "listing-images",
  collections: {
    listings: "listings",
    showings: "showings",
    applications: "applications",
    conversations: "conversations",
    messages: "messages",
    notifications: "notifications",
  },
} as const;

export const SESSION_COOKIE = "doorway_session";

export function getAppwriteEndpoint() {
  return (process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "").replace(/\/$/, "");
}

export function getAppwriteProjectId() {
  return process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "";
}

export function getAppwriteApiKey() {
  return process.env.APPWRITE_API_KEY ?? "";
}

export function hasAppwriteEnv() {
  return Boolean(
    getAppwriteEndpoint() &&
      getAppwriteProjectId() &&
      getAppwriteApiKey(),
  );
}

export function hasAppwritePublicEnv() {
  return Boolean(getAppwriteEndpoint() && getAppwriteProjectId());
}

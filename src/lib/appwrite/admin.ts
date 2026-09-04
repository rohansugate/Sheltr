import { Client, Databases, Storage, Users, Account } from "node-appwrite";
import {
  getAppwriteApiKey,
  getAppwriteEndpoint,
  getAppwriteProjectId,
  hasAppwriteEnv,
} from "./config";

export function createAdminClient() {
  if (!hasAppwriteEnv()) {
    throw new Error(
      "Missing Appwrite env: NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, APPWRITE_API_KEY",
    );
  }

  const client = new Client()
    .setEndpoint(getAppwriteEndpoint())
    .setProject(getAppwriteProjectId())
    .setKey(getAppwriteApiKey());

  return {
    client,
    users: new Users(client),
    databases: new Databases(client),
    storage: new Storage(client),
  };
}

/** Session-scoped client (user cookie secret). */
export function createSessionClient(sessionSecret: string) {
  if (!hasAppwritePublicEnvSafe()) {
    throw new Error("Missing Appwrite public env");
  }

  const client = new Client()
    .setEndpoint(getAppwriteEndpoint())
    .setProject(getAppwriteProjectId())
    .setSession(sessionSecret);

  return {
    client,
    account: new Account(client),
    databases: new Databases(client),
    storage: new Storage(client),
  };
}

/** Unauthenticated project client (login/signup session creation). */
export function createProjectClient() {
  if (!hasAppwritePublicEnvSafe()) {
    throw new Error("Missing Appwrite public env");
  }

  const client = new Client()
    .setEndpoint(getAppwriteEndpoint())
    .setProject(getAppwriteProjectId());

  return {
    client,
    account: new Account(client),
  };
}

function hasAppwritePublicEnvSafe() {
  return Boolean(getAppwriteEndpoint() && getAppwriteProjectId());
}

/**
 * One-time Appwrite schema bootstrap for Sheltr.
 * Usage: node --env-file=.env.local scripts/setup-appwrite.mjs
 */
import {
  Client,
  Databases,
  Storage,
  Permission,
  Role,
  DatabasesIndexType,
} from "node-appwrite";

const endpoint = (process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "").replace(/\/$/, "");
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";
const apiKey = process.env.APPWRITE_API_KEY || "";

if (!endpoint || !projectId || !apiKey) {
  console.error("Missing Appwrite env vars in .env.local");
  process.exit(1);
}

const DB = "sheltr";
const BUCKET = "listing-images";

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);
const storage = new Storage(client);

async function ignoreExists(fn) {
  try {
    return await fn();
  } catch (err) {
    if (err?.code === 409) return null;
    throw err;
  }
}

async function wait(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function waitForAttributes(collectionId, keys, attempts = 30) {
  for (let i = 0; i < attempts; i++) {
    const attrs = await databases.listAttributes({
      databaseId: DB,
      collectionId,
    });
    const byKey = new Map((attrs.attributes || []).map((a) => [a.key, a]));
    const ready = keys.every((k) => {
      const a = byKey.get(k);
      return a && (a.status === "available" || a.status === undefined);
    });
    if (ready) return;
    await wait(2000);
  }
  throw new Error(`Attributes not ready for ${collectionId}: ${keys.join(",")}`);
}

async function createKeyIndex(col, key, attrs) {
  await waitForAttributes(col, attrs);
  await ignoreExists(() =>
    databases.createIndex({
      databaseId: DB,
      collectionId: col,
      key,
      type: DatabasesIndexType.Key,
      attributes: attrs,
    }),
  );
}

async function createString(col, key, size, required = false, array = false) {
  await ignoreExists(() =>
    databases.createStringAttribute({
      databaseId: DB,
      collectionId: col,
      key,
      size,
      required,
      array,
    }),
  );
}

async function createInt(col, key, required = false) {
  await ignoreExists(() =>
    databases.createIntegerAttribute({
      databaseId: DB,
      collectionId: col,
      key,
      required,
    }),
  );
}

async function createFloat(col, key, required = false) {
  await ignoreExists(() =>
    databases.createFloatAttribute({
      databaseId: DB,
      collectionId: col,
      key,
      required,
    }),
  );
}

async function createBool(col, key, required = false, defaultValue) {
  await ignoreExists(() =>
    databases.createBooleanAttribute({
      databaseId: DB,
      collectionId: col,
      key,
      required,
      default: defaultValue,
    }),
  );
}

async function createEnum(col, key, elements, required = false) {
  await ignoreExists(() =>
    databases.createEnumAttribute({
      databaseId: DB,
      collectionId: col,
      key,
      elements,
      required,
    }),
  );
}

async function createCollection(id, name) {
  await ignoreExists(() =>
    databases.createCollection({
      databaseId: DB,
      collectionId: id,
      name,
      permissions: [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ],
      documentSecurity: true,
      enabled: true,
    }),
  );
}

console.log("Creating database…");
await ignoreExists(() =>
  databases.create({ databaseId: DB, name: "Sheltr", enabled: true }),
);

console.log("Creating collections…");
await createCollection("listings", "Listings");
await createCollection("showings", "Showings");
await createCollection("applications", "Applications");
await createCollection("conversations", "Conversations");
await createCollection("messages", "Messages");

console.log("Creating listing attributes…");
await createString("listings", "landlordId", 64, true);
await createString("listings", "title", 256, true);
await createInt("listings", "monthlyRent", true);
await createInt("listings", "bedrooms", true);
await createFloat("listings", "bathrooms", true);
await createString("listings", "zipCode", 10, true);
await createString("listings", "neighborhood", 128, false);
await createBool("listings", "isSection8Approved", false, false);
await createBool("listings", "isGroundFloor", false, false);
await createBool("listings", "landlordVerified", false, false);
await createFloat("listings", "latitude", false);
await createFloat("listings", "longitude", false);
await createString("listings", "images", 256, false, true);
await createString("listings", "transitLines", 64, false, true);
await createEnum(
  "listings",
  "source",
  ["MANUAL", "IMPORTED", "PLATFORM", "ZILLOW"],
  true,
);
await createEnum(
  "listings",
  "status",
  ["ACTIVE", "PENDING_REVIEW", "INACTIVE", "DRAFT"],
  true,
);
await createString("listings", "sourceUrl", 1024, false);
await createString("listings", "utilitiesIncluded", 256, false);
await createString("listings", "availableDate", 32, false);
await createBool("listings", "petsAllowed", false);
await createInt("listings", "views", false);
await createInt("listings", "saves", false);
await createInt("listings", "applicationsCount", false);

console.log("Creating showing attributes…");
await createString("showings", "listingId", 64, true);
await createString("showings", "seekerId", 64, true);
await createString("showings", "seekerName", 128, true);
await createString("showings", "date", 32, true);
await createString("showings", "time", 32, true);
await createEnum("showings", "contactMethod", ["phone", "email"], true);
await createString("showings", "contactValue", 256, true);
await createEnum("showings", "status", ["REQUESTED", "ACCEPTED", "DECLINED"], true);
await createString("showings", "landlordMessage", 1024, false);

console.log("Creating application attributes…");
await createString("applications", "listingId", 64, true);
await createString("applications", "showingId", 64, true);
await createString("applications", "seekerId", 64, true);
await createString("applications", "seekerName", 128, true);
await createString("applications", "packetJson", 2000, true);
await createEnum(
  "applications",
  "status",
  ["SENT", "VIEWED", "ACCEPTED", "DECLINED", "INTERVIEW_SCHEDULED", "LEASE_SIGNED"],
  true,
);
await createString("applications", "sentAt", 64, true);

console.log("Creating conversation attributes…");
await createString("conversations", "listingId", 64, true);
await createString("conversations", "listingTitle", 256, true);
await createString("conversations", "seekerId", 64, true);
await createString("conversations", "seekerName", 128, true);
await createString("conversations", "landlordId", 64, true);
await createString("conversations", "landlordName", 128, true);
await createString("conversations", "applicationId", 64, false);
await createString("conversations", "showingId", 64, false);

console.log("Creating message attributes…");
await createString("messages", "conversationId", 64, true);
await createString("messages", "senderId", 64, true);
await createEnum("messages", "senderRole", ["SEEKER", "LANDLORD"], true);
await createString("messages", "text", 4000, true);
await createString("messages", "sentAt", 64, true);

console.log("Waiting for attributes to become available…");
await wait(2000);

console.log("Creating indexes…");
await createKeyIndex("listings", "landlordId_idx", ["landlordId"]);
await createKeyIndex("listings", "zipCode_idx", ["zipCode"]);
await createKeyIndex("listings", "status_idx", ["status"]);
await createKeyIndex("showings", "listingId_idx", ["listingId"]);
await createKeyIndex("showings", "seekerId_idx", ["seekerId"]);
await createKeyIndex("applications", "listingId_idx", ["listingId"]);
await createKeyIndex("applications", "seekerId_idx", ["seekerId"]);
await createKeyIndex("conversations", "seekerId_idx", ["seekerId"]);
await createKeyIndex("conversations", "landlordId_idx", ["landlordId"]);
await createKeyIndex("messages", "conversationId_idx", ["conversationId"]);

console.log("Creating storage bucket…");
await ignoreExists(() =>
  storage.createBucket({
    bucketId: BUCKET,
    name: "Listing images",
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ],
    fileSecurity: true,
    enabled: true,
    maximumFileSize: 10 * 1024 * 1024,
    allowedFileExtensions: ["jpg", "jpeg", "png", "webp", "gif", "heic"],
    compression: "gzip",
    encryption: false,
    antivirus: false,
  }),
);

console.log("Done. Database:", DB, "Bucket:", BUCKET);

import { ID, Query } from "node-appwrite";
import {
  createAdminClient,
  createSessionClient,
} from "./appwrite/admin";
import {
  getAppwriteEndpoint,
  getAppwriteProjectId,
  hasAppwriteEnv,
  hasAppwritePublicEnv,
} from "./appwrite/config";
import {
  clearSessionCookie,
  getSessionSecret,
  setSessionCookie,
} from "./appwrite/session";
import type { User, UserRole } from "./types";

export interface PublicAuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "SEEKER" | "LANDLORD";
}

type Prefs = {
  role?: string;
  firstName?: string;
  lastName?: string;
};

export function toAppUser(publicUser: PublicAuthUser): User {
  return {
    id: publicUser.id,
    role: publicUser.role as UserRole,
    firstName: publicUser.firstName,
    lastName: publicUser.lastName,
    email: publicUser.email,
    accountStatus: "ACTIVE",
  };
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function mapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("already exists") || lower.includes("user_already_exists")) {
    return "An account with this email already exists.";
  }
  if (
    lower.includes("invalid credentials") ||
    lower.includes("invalid `email` or `password`") ||
    lower.includes("user_invalid_credentials")
  ) {
    return "Invalid email or password.";
  }
  if (lower.includes("password")) {
    return message;
  }
  return message;
}

function validatePassword(password: string, forSignup = false): string | null {
  if (!password || password.trim().length === 0) {
    return "Password is required.";
  }
  if (forSignup && password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  return null;
}

function prefsToPublicUser(
  id: string,
  email: string,
  prefs: Prefs,
  name?: string,
): PublicAuthUser | { error: string } {
  const role = prefs.role === "LANDLORD" ? "LANDLORD" : prefs.role === "SEEKER" ? "SEEKER" : null;
  if (!role) {
    return { error: "Account not found in Sheltr. Please sign up first." };
  }

  let firstName = (prefs.firstName ?? "").trim();
  let lastName = (prefs.lastName ?? "").trim();
  if ((!firstName || !lastName) && name) {
    const parts = name.trim().split(/\s+/);
    firstName = firstName || parts[0] || "User";
    lastName = lastName || parts.slice(1).join(" ") || "Sheltr";
  }

  return {
    id,
    email,
    firstName: firstName || "User",
    lastName: lastName || "Sheltr",
    role,
  };
}

export async function lookupProfileByEmail(
  email: string,
): Promise<PublicAuthUser | null> {
  if (!hasAppwriteEnv()) return null;

  const normalized = normalizeEmail(email);
  const { users } = createAdminClient();
  const result = await users.list({
    queries: [Query.equal("email", normalized), Query.limit(1)],
  });
  const user = result.users?.[0];
  if (!user) return null;

  const mapped = prefsToPublicUser(
    user.$id,
    user.email,
    (user.prefs ?? {}) as Prefs,
    user.name,
  );
  if ("error" in mapped) return null;
  return mapped;
}

export async function getSessionUser(): Promise<User | null> {
  if (!hasAppwritePublicEnv()) return null;

  const secret = await getSessionSecret();
  if (!secret) return null;

  try {
    const { account } = createSessionClient(secret);
    const user = await account.get();
    const mapped = prefsToPublicUser(
      user.$id,
      user.email,
      (user.prefs ?? {}) as Prefs,
      user.name,
    );
    if ("error" in mapped) {
      await signOutSession();
      return null;
    }
    return toAppUser(mapped);
  } catch {
    return null;
  }
}

export async function signOutSession() {
  const secret = await getSessionSecret();
  if (secret && hasAppwritePublicEnv()) {
    try {
      const { account } = createSessionClient(secret);
      await account.deleteSession({ sessionId: "current" });
    } catch {
      // Session already invalid
    }
  }
  await clearSessionCookie();
}

export async function createUser(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "SEEKER" | "LANDLORD";
}): Promise<{ user: PublicAuthUser } | { error: string }> {
  if (!hasAppwriteEnv()) {
    return {
      error:
        "Appwrite is not configured. Add NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, and APPWRITE_API_KEY.",
    };
  }

  const email = normalizeEmail(input.email);
  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  const existing = await lookupProfileByEmail(email);
  if (existing) {
    return { error: "An account with this email already exists. Log in instead." };
  }

  const passwordError = validatePassword(input.password, true);
  if (passwordError) return { error: passwordError };

  if (!input.firstName.trim() || !input.lastName.trim()) {
    return { error: "First and last name are required." };
  }
  if (input.role !== "SEEKER" && input.role !== "LANDLORD") {
    return { error: "Choose tenant or landlord." };
  }

  const { users } = createAdminClient();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();

  try {
    const created = await users.create({
      userId: ID.unique(),
      email,
      password: input.password,
      name: `${firstName} ${lastName}`,
    });

    await users.updatePrefs({
      userId: created.$id,
      prefs: {
        role: input.role,
        firstName,
        lastName,
      },
    });

    await users.updateEmailVerification({
      userId: created.$id,
      emailVerification: true,
    });

    const session = await users.createSession({ userId: created.$id });
    await setSessionCookie(session.secret);

    return {
      user: {
        id: created.$id,
        email,
        firstName,
        lastName,
        role: input.role,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create account.";
    return { error: mapAuthError(message) };
  }
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<{ user: PublicAuthUser } | { error: string }> {
  if (!hasAppwritePublicEnv()) {
    return {
      error:
        "Appwrite is not configured. Add NEXT_PUBLIC_APPWRITE_ENDPOINT and NEXT_PUBLIC_APPWRITE_PROJECT_ID.",
    };
  }

  const normalizedEmail = normalizeEmail(email);
  const passwordError = validatePassword(password);
  if (passwordError) return { error: passwordError };

  const known = await lookupProfileByEmail(normalizedEmail);
  if (!known) {
    return { error: "No account found with this email. Create one first." };
  }

  try {
    // Validate password with the public Account email-session endpoint.
    const endpoint = getAppwriteEndpoint();
    const projectId = getAppwriteProjectId();
    const res = await fetch(`${endpoint}/account/sessions/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Appwrite-Project": projectId,
      },
      body: JSON.stringify({
        email: normalizedEmail,
        password,
      }),
    });

    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as {
        message?: string;
      } | null;
      return {
        error: mapAuthError(payload?.message ?? "Invalid email or password."),
      };
    }

    // REST often omits session secret server-side; mint an admin session after password check.
    const { users } = createAdminClient();
    const session = await users.createSession({ userId: known.id });
    await setSessionCookie(session.secret);

    return { user: known };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid email or password.";
    return { error: mapAuthError(message) };
  }
}

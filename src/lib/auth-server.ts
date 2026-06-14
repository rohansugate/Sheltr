import type { User, UserRole } from "./types";
import { createAdminClient } from "./supabase/admin";
import { createClient } from "./supabase/server";

export interface PublicAuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "SEEKER" | "LANDLORD";
}

interface ProfileRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "SEEKER" | "LANDLORD";
}

function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function hasServiceRole() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function profileToPublicUser(profile: ProfileRow): PublicAuthUser {
  return {
    id: profile.id,
    email: profile.email,
    firstName: profile.first_name,
    lastName: profile.last_name,
    role: profile.role,
  };
}

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
  if (lower.includes("already registered") || lower.includes("already exists")) {
    return "An account with this email already exists.";
  }
  if (lower.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }
  if (lower.includes("email not confirmed")) {
    return "Confirm your email before signing in.";
  }
  return message;
}

async function fetchProfile(userId: string) {
  const supabase = await createClient();
  return supabase
    .from("profiles")
    .select("id, email, first_name, last_name, role")
    .eq("id", userId)
    .single<ProfileRow>();
}

async function fetchProfileWithAdmin(userId: string) {
  if (!hasServiceRole()) return fetchProfile(userId);
  const admin = createAdminClient();
  return admin
    .from("profiles")
    .select("id, email, first_name, last_name, role")
    .eq("id", userId)
    .single<ProfileRow>();
}

export async function lookupProfileByEmail(
  email: string,
): Promise<ProfileRow | null> {
  if (!hasSupabaseEnv()) return null;

  const normalized = normalizeEmail(email);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("lookup_profile_by_email", {
    p_email: normalized,
  });

  if (error || !data) return null;

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;

  return row as ProfileRow;
}

async function requireProfileInDatabase(
  userId: string,
  email?: string,
): Promise<ProfileRow | { error: string }> {
  const { data: profile, error } = await fetchProfileWithAdmin(userId);
  if (error || !profile) {
    return { error: "Account not found in Doorway. Please sign up first." };
  }
  if (email && normalizeEmail(profile.email) !== normalizeEmail(email)) {
    return { error: "Account verification failed. Please try again." };
  }
  return profile;
}

export async function getSessionUser(): Promise<User | null> {
  if (!hasSupabaseEnv()) return null;

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;

  const verified = await requireProfileInDatabase(data.user.id);
  if ("error" in verified) {
    await signOutSession();
    return null;
  }

  return toAppUser(profileToPublicUser(verified));
}

export async function signOutSession() {
  if (!hasSupabaseEnv()) return;
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function createUser(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "SEEKER" | "LANDLORD";
}): Promise<{ user: PublicAuthUser } | { error: string }> {
  if (!hasSupabaseEnv()) {
    return {
      error: "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
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

  if (input.password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }
  if (!input.firstName.trim() || !input.lastName.trim()) {
    return { error: "First and last name are required." };
  }
  if (input.role !== "SEEKER" && input.role !== "LANDLORD") {
    return { error: "Choose tenant or landlord." };
  }

  const metadata = {
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    role: input.role,
  };

  let userId: string | null = null;

  if (hasServiceRole()) {
    const admin = createAdminClient();
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (authError || !authData.user) {
      return { error: mapAuthError(authError?.message ?? "Could not create account.") };
    }
    userId = authData.user.id;
  } else {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: input.password,
      options: { data: metadata },
    });
    if (authError || !authData.user) {
      return { error: mapAuthError(authError?.message ?? "Could not create account.") };
    }
    userId = authData.user.id;
  }

  const { data: profile } = await fetchProfileWithAdmin(userId);
  if (!profile) {
    return { error: "Account was created but not verified in Doorway. Try logging in." };
  }

  return { user: profileToPublicUser(profile) };
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<{ user: PublicAuthUser } | { error: string }> {
  if (!hasSupabaseEnv()) {
    return {
      error: "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const normalizedEmail = normalizeEmail(email);
  const knownProfile = await lookupProfileByEmail(normalizedEmail);
  if (!knownProfile) {
    return { error: "No account found with this email. Create one first." };
  }

  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (authError || !authData.user) {
    return { error: mapAuthError(authError?.message ?? "Invalid email or password.") };
  }

  const verified = await requireProfileInDatabase(authData.user.id, normalizedEmail);
  if ("error" in verified) {
    await signOutSession();
    return { error: verified.error };
  }

  return { user: profileToPublicUser(verified) };
}

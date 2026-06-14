import { useDoorwayStore } from "./store";

export async function signOutAccount() {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // Clear local state even if network fails
  }
  useDoorwayStore.getState().logoutUser();
}

export async function switchAccount(options?: {
  role?: "SEEKER" | "LANDLORD";
  mode?: "login" | "signup";
}) {
  await signOutAccount();
  const params = new URLSearchParams({ switch: "1" });
  if (options?.role) params.set("role", options.role);
  if (options?.mode) params.set("mode", options.mode);
  window.location.href = `/auth?${params.toString()}`;
}

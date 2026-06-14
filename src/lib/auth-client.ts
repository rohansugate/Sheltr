import { useDoorwayStore } from "./store";

export async function signOutAccount() {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // Clear local state even if network fails
  }
  useDoorwayStore.getState().logoutUser();
}

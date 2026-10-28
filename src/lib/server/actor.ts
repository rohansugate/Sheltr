import { getSessionUser } from "../auth-server";
import type { Actor } from "./authorize";

export async function getSessionActor(): Promise<Actor | null> {
  const user = await getSessionUser();
  if (!user || (user.role !== "SEEKER" && user.role !== "LANDLORD")) return null;
  return {
    id: user.id,
    role: user.role,
    name: `${user.firstName} ${user.lastName}`.trim() || "Sheltr user",
  };
}

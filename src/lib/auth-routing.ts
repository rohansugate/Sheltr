import type { User } from "./types";

export function homePathForUser(
  user: User,
  onboardingComplete: boolean,
): string {
  if (user.role === "LANDLORD") return "/landlord";
  return onboardingComplete ? "/discover" : "/onboarding";
}

export function isTenantPath(pathname: string) {
  return (
    pathname === "/discover" ||
    pathname === "/matches" ||
    pathname === "/messages" ||
    pathname === "/profile" ||
    pathname === "/onboarding" ||
    pathname.startsWith("/discover/") ||
    pathname.startsWith("/matches/") ||
    pathname.startsWith("/messages/") ||
    pathname.startsWith("/profile/") ||
    pathname.startsWith("/onboarding/")
  );
}

export function isLandlordPath(pathname: string) {
  return pathname === "/landlord" || pathname.startsWith("/landlord/");
}

export function pathForRole(role: User["role"], onboardingComplete: boolean) {
  if (role === "LANDLORD") return "/landlord";
  return onboardingComplete ? "/discover" : "/onboarding";
}

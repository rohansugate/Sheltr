"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { homePathForUser, isLandlordPath, isTenantPath } from "@/lib/auth-routing";
import { useDoorwayStore } from "@/lib/store";

const PUBLIC_PATHS = new Set(["/", "/auth"]);

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = useDoorwayStore((s) => s.currentUser);
  const role = useDoorwayStore((s) => s.role);
  const onboardingComplete = useDoorwayStore((s) => s.onboardingComplete);

  useEffect(() => {
    if (currentUser && pathname === "/auth") {
      router.replace(homePathForUser(currentUser, onboardingComplete));
      return;
    }

    if (PUBLIC_PATHS.has(pathname)) return;

    if (!currentUser) {
      if (role) return;
      router.replace("/auth?switch=1&mode=login");
      return;
    }

    if (currentUser.role === "SEEKER" && isLandlordPath(pathname)) {
      router.replace(homePathForUser(currentUser, onboardingComplete));
      return;
    }

    if (currentUser.role === "LANDLORD" && isTenantPath(pathname)) {
      router.replace("/landlord");
    }
  }, [pathname, currentUser, role, onboardingComplete, router]);

  if (!PUBLIC_PATHS.has(pathname) && !currentUser && !role) {
    return null;
  }

  return children;
}

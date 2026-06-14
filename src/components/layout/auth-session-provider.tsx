"use client";

import { useEffect } from "react";
import { useDoorwayStore } from "@/lib/store";

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const loginUser = useDoorwayStore((s) => s.loginUser);
  const logoutUser = useDoorwayStore((s) => s.logoutUser);

  useEffect(() => {
    let cancelled = false;

    async function syncSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const local = useDoorwayStore.getState().currentUser;

        if (data.user) {
          if (!local || local.id !== data.user.id) {
            loginUser(data.user);
          }
          return;
        }

        if (local && !cancelled) {
          logoutUser();
        }
      } catch {
        // Offline or Supabase not configured — demo mode still works
      }
    }

    syncSession();
    return () => {
      cancelled = true;
    };
  }, [loginUser, logoutUser]);

  return children;
}

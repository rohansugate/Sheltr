"use client";

import { useEffect } from "react";
import { setAppwritePersistEnabled } from "@/lib/appwrite-client";
import { useSheltrStore } from "@/lib/store";

const DEMO_BYPASS = process.env.NEXT_PUBLIC_ALLOW_DEMO_BYPASS === "true";

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const loginUser = useSheltrStore((s) => s.loginUser);
  const logoutUser = useSheltrStore((s) => s.logoutUser);

  useEffect(() => {
    let cancelled = false;

    async function syncSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const local = useSheltrStore.getState().currentUser;

        setAppwritePersistEnabled(Boolean(data.user));
        if (data.user) {
          if (!local || local.id !== data.user.id) {
            loginUser(data.user);
          }
          return;
        }

        // Keep hackathon/demo sessions when auth is offline or unused
        if (DEMO_BYPASS) return;

        if (local && !cancelled) {
          logoutUser();
        }
      } catch {
        // Offline or Appwrite not configured — demo mode still works
      }
    }

    syncSession();
    return () => {
      cancelled = true;
    };
  }, [loginUser, logoutUser]);

  return children;
}

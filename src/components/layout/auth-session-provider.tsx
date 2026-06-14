"use client";

import { useEffect } from "react";
import { useDoorwayStore } from "@/lib/store";

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const currentUser = useDoorwayStore((s) => s.currentUser);
  const loginUser = useDoorwayStore((s) => s.loginUser);

  useEffect(() => {
    if (currentUser) return;

    let cancelled = false;

    async function restoreSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (data.user && !cancelled) {
          loginUser(data.user);
        }
      } catch {
        // Offline or Supabase not configured — demo mode still works
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, [currentUser, loginUser]);

  return children;
}

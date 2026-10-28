"use client";

import { useEffect, useRef } from "react";
import { useSheltrStore } from "@/lib/store";
import type { DemoSyncPayload } from "@/lib/types";

/** Load public listings from Appwrite once. Per-user records come from SyncProvider. */
export function AppwriteBootstrapProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;

    async function boot() {
      try {
        await fetch("/api/bootstrap", { method: "POST" }).catch(() => null);
        const res = await fetch("/api/bootstrap", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!data.listings) return;

        const payload: DemoSyncPayload = {
          listings: data.listings ?? [],
          applications: [],
          showings: [],
          conversations: [],
          messages: [],
          notifications: [],
          updatedAt: new Date().toISOString(),
        };

        // Keep the local seed if Appwrite has no listings yet.
        if (payload.listings.length > 0) {
          useSheltrStore.getState().applyRemoteSync(payload);
        }
      } catch {
        // Demo mode still works offline
      }
    }

    void boot();
  }, []);

  return children;
}

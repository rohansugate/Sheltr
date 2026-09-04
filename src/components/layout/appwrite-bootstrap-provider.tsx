"use client";

import { useEffect, useRef } from "react";
import { useDoorwayStore } from "@/lib/store";
import type { DemoSyncPayload } from "@/lib/types";

/** Load Sheltr domain data from Appwrite and seed curated listings once. */
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
          applications: data.applications ?? [],
          showings: data.showings ?? [],
          conversations: data.conversations ?? [],
          messages: data.messages ?? [],
          notifications: useDoorwayStore.getState().notifications,
          updatedAt: new Date().toISOString(),
        };

        // Prefer Appwrite rows when present; keep local seed if empty response.
        if (payload.listings.length > 0 || payload.applications.length > 0) {
          useDoorwayStore.getState().applyRemoteSync(payload);
          useDoorwayStore.getState().setSyncStatus({
            storage: "redis",
            ready: true,
            lastPulledAt: new Date().toISOString(),
            syncing: false,
          });
        }
      } catch {
        // Demo mode still works offline
      }
    }

    void boot();
  }, []);

  return children;
}

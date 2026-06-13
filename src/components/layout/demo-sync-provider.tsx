"use client";

import { useEffect, useRef } from "react";
import { buildSyncPayload, pullDemoSync, pushDemoSync } from "@/lib/demo-sync";
import { useDoorwayStore } from "@/lib/store";

const POLL_MS = 2500;

export function DemoSyncProvider({ children }: { children: React.ReactNode }) {
  const hydrated = useRef(false);
  const pushing = useRef(false);
  const setSyncStatus = useDoorwayStore((s) => s.setSyncStatus);

  useEffect(() => {
    let cancelled = false;

    const pull = async () => {
      const remote = await pullDemoSync();
      if (cancelled || !remote) return;

      setSyncStatus({
        storage: remote.storage,
        ready: remote.ready,
        lastPulledAt: new Date().toISOString(),
      });

      if (!remote.state?.updatedAt) return;

      const localUpdated = useDoorwayStore.getState().lastSyncedAt ?? "";
      if (remote.state.updatedAt > localUpdated) {
        useDoorwayStore.getState().applyRemoteSync(remote.state);
      }
    };

    pull().then(() => {
      hydrated.current = true;
    });

    const interval = setInterval(pull, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [setSyncStatus]);

  useEffect(() => {
    const unsub = useDoorwayStore.subscribe((state, prev) => {
      if (!hydrated.current || pushing.current) return;

      const changed =
        state.listings !== prev.listings ||
        state.applications !== prev.applications ||
        state.showings !== prev.showings ||
        state.conversations !== prev.conversations ||
        state.messages !== prev.messages ||
        state.notifications !== prev.notifications;

      if (!changed) return;

      pushing.current = true;
      const payload = buildSyncPayload({
        listings: state.listings,
        applications: state.applications,
        showings: state.showings,
        conversations: state.conversations,
        messages: state.messages,
        notifications: state.notifications,
      });
      pushDemoSync(payload).finally(() => {
        useDoorwayStore.setState({ lastSyncedAt: payload.updatedAt });
        pushing.current = false;
      });
    });

    return unsub;
  }, []);

  return children;
}

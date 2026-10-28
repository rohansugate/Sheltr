"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import {
  isAppwritePersistEnabled,
  setAppwritePersistEnabled,
  subscribeAppwritePersist,
} from "@/lib/appwrite-client";
import { buildSyncPayload, pullDemoSync, pushDemoSync } from "@/lib/demo-sync";
import { useSheltrStore } from "@/lib/store";
import type { UserSyncPayload } from "@/lib/types";

const POLL_MS = 4000;
const DEMO_BYPASS = process.env.NEXT_PUBLIC_ALLOW_DEMO_BYPASS === "true";

/**
 * Signed-in users poll their own records from Appwrite (/api/sync).
 * Without a session, demo-bypass builds fall back to the shared demo room.
 */
export function DemoSyncProvider({ children }: { children: React.ReactNode }) {
  const signedIn = useSyncExternalStore(
    subscribeAppwritePersist,
    isAppwritePersistEnabled,
    () => false,
  );
  useUserSync(signedIn);
  useSharedDemoSync(DEMO_BYPASS && !signedIn);
  return children;
}

function useUserSync(enabled: boolean) {
  const setSyncStatus = useSheltrStore((s) => s.setSyncStatus);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let inFlight = false;

    const run = async () => {
      if (cancelled || inFlight || document.visibilityState === "hidden") return;
      inFlight = true;
      try {
        const res = await fetch("/api/sync", { cache: "no-store" });
        if (res.status === 401) {
          setAppwritePersistEnabled(false);
          return;
        }
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as UserSyncPayload;
        useSheltrStore.getState().applyServerSync(data);
        setSyncStatus({
          storage: "appwrite",
          ready: true,
          lastPulledAt: new Date().toISOString(),
          syncing: false,
        });
      } catch {
        // Offline: keep local state and retry on the next tick.
      } finally {
        inFlight = false;
      }
    };

    void run();
    const interval = setInterval(run, POLL_MS);
    document.addEventListener("visibilitychange", run);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", run);
    };
  }, [enabled, setSyncStatus]);
}

function useSharedDemoSync(enabled: boolean) {
  const pushing = useRef(false);
  const localRevision = useRef(0);
  const setSyncStatus = useSheltrStore((s) => s.setSyncStatus);

  const pull = useCallback(async () => {
    if (pushing.current) return;

    const remote = await pullDemoSync();
    if (!remote) {
      setSyncStatus({
        storage: "memory",
        ready: false,
        lastPulledAt: new Date().toISOString(),
        syncing: false,
      });
      return;
    }

    setSyncStatus({
      storage: remote.storage,
      ready: remote.ready,
      lastPulledAt: new Date().toISOString(),
      syncing: false,
    });

    if (!remote.state?.updatedAt) return;

    // Pulls merge with local state, and pulls are skipped while a push is in flight.
    // lastLocalRevision is not compared: it is persisted, so another tab or a reload
    // would load a revision this tab's counter never reaches and block every pull.
    const localUpdated = useSheltrStore.getState().lastSyncedAt ?? "";
    if (remote.state.updatedAt > localUpdated) {
      useSheltrStore.getState().applyRemoteSync(remote.state);
    }
  }, [setSyncStatus]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const runPull = async () => {
      if (cancelled) return;
      setSyncStatus({
        storage: useSheltrStore.getState().syncStatus?.storage ?? "memory",
        ready: useSheltrStore.getState().syncStatus?.ready ?? false,
        lastPulledAt: useSheltrStore.getState().syncStatus?.lastPulledAt ?? null,
        syncing: true,
      });
      await pull();
    };

    runPull();
    const interval = setInterval(runPull, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [enabled, pull, setSyncStatus]);

  useEffect(() => {
    if (!enabled) return;
    const unsub = useSheltrStore.subscribe((state, prev) => {
      if (pushing.current) return;

      const changed =
        state.listings !== prev.listings ||
        state.applications !== prev.applications ||
        state.showings !== prev.showings ||
        state.conversations !== prev.conversations ||
        state.messages !== prev.messages ||
        state.notifications !== prev.notifications;

      if (!changed) return;

      localRevision.current += 1;
      const revision = localRevision.current;
      pushing.current = true;

      const payload = buildSyncPayload({
        listings: state.listings,
        applications: state.applications,
        showings: state.showings,
        conversations: state.conversations,
        messages: state.messages,
        notifications: state.notifications,
      });

      useSheltrStore.setState({
        lastSyncedAt: payload.updatedAt,
        lastLocalRevision: revision,
      });

      setSyncStatus({
        storage: state.syncStatus?.storage ?? "memory",
        ready: state.syncStatus?.ready ?? false,
        lastPulledAt: state.syncStatus?.lastPulledAt ?? null,
        syncing: true,
      });

      pushDemoSync(payload)
        .finally(() => {
          pushing.current = false;
          setSyncStatus({
            storage: useSheltrStore.getState().syncStatus?.storage ?? "memory",
            ready: useSheltrStore.getState().syncStatus?.ready ?? false,
            lastPulledAt: useSheltrStore.getState().syncStatus?.lastPulledAt ?? null,
            syncing: false,
          });
        });
    });

    return unsub;
  }, [enabled, setSyncStatus]);
}

"use client";

import { useDoorwayStore } from "@/lib/store";

export function SyncStatusBadge() {
  const syncStatus = useDoorwayStore((s) => s.syncStatus);

  if (!syncStatus) return null;

  const isLive = syncStatus.storage === "redis" && syncStatus.ready;

  return (
    <div className="mx-5 mb-3 flex items-center gap-2 text-xs text-muted-foreground">
      <span
        className={`size-2 rounded-full ${isLive ? "bg-emerald-500" : "bg-amber-400"}`}
        aria-hidden
      />
      <span>
        {isLive
          ? "Live sync — open this URL on both phones"
          : "Local sync — add Upstash Redis on Vercel for two-phone demo"}
      </span>
    </div>
  );
}

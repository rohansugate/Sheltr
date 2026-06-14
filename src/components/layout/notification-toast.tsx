"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { resolveSeeker } from "@/lib/current-user";
import { useDoorwayStore } from "@/lib/store";
import type { Notification } from "@/lib/types";

function isForCurrentUser(notification: Notification, seekerId: string) {
  return !notification.seekerId || notification.seekerId === seekerId;
}

export function NotificationToast() {
  const currentUser = useDoorwayStore((s) => s.currentUser);
  const notifications = useDoorwayStore((s) => s.notifications);
  const role = useDoorwayStore((s) => s.role);
  const seen = useRef(new Set<string>());
  const [active, setActive] = useState<Notification | null>(null);

  useEffect(() => {
    if (role !== "SEEKER") return;

    const seeker = resolveSeeker(currentUser);
    const next = notifications.find(
      (n) =>
        !n.read &&
        isForCurrentUser(n, seeker.id) &&
        !seen.current.has(n.id) &&
        (n.title.includes("accepted") || n.title.includes("Showing accepted")),
    );

    if (!next) return;

    seen.current.add(next.id);
    setActive(next);

    const timer = window.setTimeout(() => setActive(null), 8000);
    return () => window.clearTimeout(timer);
  }, [notifications, currentUser, role]);

  if (!active) return null;

  const href = active.conversationId
    ? `/messages?conversationId=${active.conversationId}`
    : "/profile";

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex justify-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <Link
        href={href}
        className="pointer-events-auto w-full max-w-md rounded-2xl border border-primary/30 bg-primary px-4 py-3 text-primary-foreground shadow-lg"
      >
        <p className="text-sm font-bold">{active.title}</p>
        <p className="mt-1 text-sm opacity-95">{active.message}</p>
        <p className="mt-2 text-xs font-semibold underline">Tap to open</p>
      </Link>
    </div>
  );
}

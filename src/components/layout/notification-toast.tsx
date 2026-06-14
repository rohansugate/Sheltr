"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  filterNotificationsForUser,
  messagesHref,
} from "@/lib/notifications";
import { useDoorwayStore } from "@/lib/store";

export function NotificationToast() {
  const currentUser = useDoorwayStore((s) => s.currentUser);
  const notifications = useDoorwayStore((s) => s.notifications);
  const role = useDoorwayStore((s) => s.role);
  const seen = useRef(new Set<string>());
  const [activeId, setActiveId] = useState<string | null>(null);

  const mine = filterNotificationsForUser(notifications, role, currentUser);
  const active = mine.find((n) => n.id === activeId);

  useEffect(() => {
    if (!role || (role !== "SEEKER" && role !== "LANDLORD")) return;

    const next = mine.find(
      (n) =>
        !n.read &&
        !seen.current.has(n.id) &&
        (n.title.toLowerCase().includes("accepted") ||
          n.title.toLowerCase().includes("message")),
    );

    if (!next) return;

    seen.current.add(next.id);
    setActiveId(next.id);

    const timer = window.setTimeout(() => setActiveId(null), 6000);
    return () => window.clearTimeout(timer);
  }, [mine, role]);

  if (!active || !role || (role !== "SEEKER" && role !== "LANDLORD")) return null;

  const href = messagesHref(role, active.conversationId);
  const headline = active.fromName
    ? `${active.title.replace("!", "")} — ${active.fromName}`
    : active.title;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex justify-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <Link
        href={href}
        className="pointer-events-auto w-full max-w-md rounded-2xl border border-primary/30 bg-primary px-4 py-3 text-primary-foreground shadow-lg"
      >
        <p className="text-sm font-bold">{headline}</p>
        <p className="mt-1 text-sm opacity-95">{active.message}</p>
        <p className="mt-2 text-xs font-semibold underline">Tap to open</p>
      </Link>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  filterNotificationsForUser,
  messagesHref,
} from "@/lib/notifications";
import { useDoorwayStore } from "@/lib/store";
import type { Notification } from "@/lib/types";

const COLLAPSED_HEIGHT = 52;
const EXPANDED_RATIO = 0.72;

function formatNotificationTitle(notification: Notification) {
  if (notification.fromName && notification.title.toLowerCase().includes("message")) {
    return `Message from ${notification.fromName}`;
  }
  if (notification.fromName) {
    return `${notification.title} · ${notification.fromName}`;
  }
  return notification.title;
}

export function NotificationSheet() {
  const currentUser = useDoorwayStore((s) => s.currentUser);
  const role = useDoorwayStore((s) => s.role);
  const notifications = useDoorwayStore((s) => s.notifications);
  const markNotificationRead = useDoorwayStore((s) => s.markNotificationRead);

  const mine = useMemo(
    () => filterNotificationsForUser(notifications, role, currentUser),
    [notifications, role, currentUser],
  );
  const unread = mine.filter((n) => !n.read);

  const [expanded, setExpanded] = useState(false);
  const [dragY, setDragY] = useState(0);
  const startY = useRef(0);
  const dragging = useRef(false);

  const maxHeight =
    typeof window !== "undefined" ? window.innerHeight * EXPANDED_RATIO : 520;

  useEffect(() => {
    if (unread.length === 0) setExpanded(false);
  }, [unread.length]);

  const onPointerDown = useCallback((clientY: number) => {
    dragging.current = true;
    startY.current = clientY;
    setDragY(0);
  }, []);

  const onPointerMove = useCallback(
    (clientY: number) => {
      if (!dragging.current) return;
      const delta = startY.current - clientY;
      setDragY(delta);
      if (!expanded && delta > 40) setExpanded(true);
      if (expanded && delta < -60) setExpanded(false);
    },
    [expanded],
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
    if (dragY > 30) setExpanded(true);
    if (dragY < -30) setExpanded(false);
    setDragY(0);
  }, [dragY]);

  if (mine.length === 0) return null;

  const sheetHeight = expanded
    ? Math.min(maxHeight, maxHeight + dragY * 0.15)
    : COLLAPSED_HEIGHT;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-16 z-[75] mx-auto flex w-full max-w-[430px] justify-center px-3"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <div
        className="pointer-events-auto w-full overflow-hidden rounded-t-3xl border border-border bg-background shadow-2xl transition-[height] duration-200"
        style={{ height: sheetHeight }}
      >
        <div
          className="flex cursor-grab flex-col items-center border-b border-border px-4 py-3 active:cursor-grabbing"
          onPointerDown={(e) => onPointerDown(e.clientY)}
          onPointerMove={(e) => onPointerMove(e.clientY)}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <div className="mb-2 h-1 w-10 rounded-full bg-muted-foreground/40" />
          <div className="flex w-full items-center justify-between gap-2">
            <p className="text-sm font-semibold">
              Notifications
              {unread.length > 0 ? ` (${unread.length})` : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              {expanded ? "Swipe down to close" : "Swipe up"}
            </p>
          </div>
        </div>

        {expanded && (
          <ul className="max-h-[calc(100%-56px)] overflow-y-auto px-3 py-2">
            {mine.slice(0, 12).map((n) => (
              <li
                key={n.id}
                className={`mb-2 rounded-2xl border px-3 py-3 text-sm ${
                  n.read ? "border-border bg-muted/40" : "border-primary/20 bg-primary/5"
                }`}
              >
                <p className="font-semibold">{formatNotificationTitle(n)}</p>
                <p className="mt-1 text-muted-foreground">{n.message}</p>
                <div className="mt-2 flex items-center gap-3">
                  {n.conversationId && role && (role === "SEEKER" || role === "LANDLORD") && (
                    <Link
                      href={messagesHref(role, n.conversationId)}
                      className="text-xs font-semibold text-primary underline"
                    >
                      Open chat
                    </Link>
                  )}
                  {!n.read && (
                    <button
                      type="button"
                      className="text-xs font-semibold text-muted-foreground"
                      onClick={() => markNotificationRead(n.id)}
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

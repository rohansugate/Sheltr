"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  filterNotificationsForUser,
  notificationHref,
} from "@/lib/notifications";
import { useDoorwayStore } from "@/lib/store";

const AUTO_DISMISS_MS = 5000;
const SWIPE_DISMISS_PX = 48;

export function NotificationToast() {
  const currentUser = useDoorwayStore((s) => s.currentUser);
  const notifications = useDoorwayStore((s) => s.notifications);
  const role = useDoorwayStore((s) => s.role);
  const seen = useRef(new Set<string>());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragY, setDragY] = useState(0);
  const startY = useRef(0);
  const dragging = useRef(false);
  const dragged = useRef(false);

  const mine = filterNotificationsForUser(notifications, role, currentUser);
  const active = mine.find((n) => n.id === activeId);

  const dismiss = useCallback(() => {
    setActiveId(null);
    setDragY(0);
    dragging.current = false;
    dragged.current = false;
  }, []);

  useEffect(() => {
    if (!role || (role !== "SEEKER" && role !== "LANDLORD")) return;

    const next = mine.find((n) => !n.read && !seen.current.has(n.id));
    if (!next) return;

    seen.current.add(next.id);
    setActiveId(next.id);
  }, [mine, role]);

  useEffect(() => {
    if (!activeId) return;
    const timer = window.setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [activeId, dismiss]);

  const onPointerDown = (clientY: number) => {
    dragging.current = true;
    dragged.current = false;
    startY.current = clientY;
    setDragY(0);
  };

  const onPointerMove = (clientY: number) => {
    if (!dragging.current) return;
    const delta = clientY - startY.current;
    if (delta < -8) dragged.current = true;
    if (delta < 0) setDragY(delta);
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (dragY <= -SWIPE_DISMISS_PX) {
      dismiss();
      return;
    }
    setDragY(0);
  };

  if (!active || !role || (role !== "SEEKER" && role !== "LANDLORD")) return null;

  const href = notificationHref(role, active);
  const headline = active.fromName
    ? `${active.title.replace("!", "")} — ${active.fromName}`
    : active.title;

  const opacity = Math.max(0, 1 + dragY / SWIPE_DISMISS_PX);

  const content = (
    <>
      <p className="text-sm font-bold">{headline}</p>
      <p className="mt-1 text-sm opacity-95">{active.message}</p>
      {href && (
        <p className="mt-2 text-xs font-semibold underline">Tap to open</p>
      )}
    </>
  );

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex justify-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div
        className="pointer-events-auto w-full max-w-md touch-none"
        style={{
          transform: `translateY(${dragY}px)`,
          opacity,
          transition: dragY === 0 ? "transform 200ms ease, opacity 200ms ease" : "none",
        }}
        onPointerDown={(e) => onPointerDown(e.clientY)}
        onPointerMove={(e) => onPointerMove(e.clientY)}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {href ? (
          <Link
            href={href}
            onClick={(e) => {
              if (dragged.current) e.preventDefault();
            }}
            className="block rounded-2xl border border-primary/30 bg-primary px-4 py-3 text-primary-foreground shadow-lg"
          >
            {content}
          </Link>
        ) : (
          <div className="rounded-2xl border border-primary/30 bg-primary px-4 py-3 text-primary-foreground shadow-lg">
            {content}
          </div>
        )}
      </div>
    </div>
  );
}

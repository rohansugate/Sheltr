"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/discover/listing-card";
import { t } from "@/lib/i18n";
import { useDoorwayStore } from "@/lib/store";
import type { Listing } from "@/lib/types";
import { cn } from "@/lib/utils";

const SWIPE_THRESHOLD = 80;

export function SwipeDeck() {
  const deck = useDoorwayStore((s) => s.deck);
  const swipe = useDoorwayStore((s) => s.swipe);
  const undoSwipe = useDoorwayStore((s) => s.undoSwipe);
  const swipeHistory = useDoorwayStore((s) => s.swipeHistory);
  const locale = useDoorwayStore((s) => s.locale);
  const a11y = useDoorwayStore((s) => s.a11y);
  const [exiting, setExiting] = useState<{
    id: string;
    direction: "left" | "right";
  } | null>(null);
  const [haptic, setHaptic] = useState(false);
  const dragRef = useRef({ startX: 0, currentX: 0, dragging: false });

  const handleSwipe = useCallback(
    (listingId: string, direction: "left" | "right") => {
      setHaptic(true);
      setTimeout(() => setHaptic(false), 200);
      if (!a11y.reduceMotion) {
        setExiting({ id: listingId, direction });
        setTimeout(() => {
          swipe(listingId, direction);
          setExiting(null);
        }, 320);
      } else {
        swipe(listingId, direction);
      }
    },
    [swipe, a11y.reduceMotion],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { startX: e.clientX, currentX: 0, dragging: true };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.dragging || a11y.reduceMotion) return;
    dragRef.current.currentX = e.clientX - dragRef.current.startX;
    const el = e.currentTarget as HTMLElement;
    const x = dragRef.current.currentX;
    el.style.transform = `translateX(${x}px) rotate(${x * 0.08}deg)`;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    const el = e.currentTarget as HTMLElement;
    const x = dragRef.current.currentX;
    el.style.transform = "";
    const topListing = deck[0];
    if (!topListing) return;
    if (x > SWIPE_THRESHOLD) handleSwipe(topListing.id, "right");
    else if (x < -SWIPE_THRESHOLD) handleSwipe(topListing.id, "left");
  };

  if (deck.length === 0) {
    return (
      <div className="flex min-h-[52dvh] flex-1 flex-col items-center justify-center gap-3 px-10 py-16 text-center">
        <h2 className="font-serif text-[1.65rem] leading-tight">No matches yet</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Adjust your voucher preferences in Profile to see more homes.
        </p>
      </div>
    );
  }

  const visibleCards = deck.slice(0, 2).reverse();

  return (
    <div className="flex flex-1 flex-col">
      {swipeHistory.length > 0 && (
        <div className="flex justify-center px-4 pt-2">
          <Button variant="ghost" size="sm" onClick={undoSwipe} aria-label={t(locale, "undo")}>
            ↩ {t(locale, "undo")}
          </Button>
        </div>
      )}

      <div className="relative mx-2 mt-1 flex-1" style={{ minHeight: "52dvh" }}>
        {visibleCards.map((listing: Listing, i: number) => {
          const isTop = i === visibleCards.length - 1;
          const isExiting = exiting?.id === listing.id;
          return (
            <ListingCard
              key={listing.id}
              listing={listing}
              locale={locale}
              className={cn(
                isTop ? "z-10" : "z-0 scale-[0.96] opacity-80",
                !a11y.reduceMotion &&
                  isExiting &&
                  (exiting.direction === "left"
                    ? "swipe-out-left"
                    : "swipe-out-right"),
              )}
              onPointerDown={isTop ? onPointerDown : undefined}
              onPointerMove={isTop ? onPointerMove : undefined}
              onPointerUp={isTop ? onPointerUp : undefined}
              onPointerLeave={isTop ? onPointerUp : undefined}
            />
          );
        })}
      </div>

      <div className={`flex items-center justify-center gap-10 px-6 py-5 ${haptic ? "haptic-pulse" : ""}`}>
        <Button
          variant="outline"
          size="icon"
          aria-label={t(locale, "pass")}
          onClick={() => handleSwipe(deck[0].id, "left")}
          className="border-foreground/20"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </Button>
        <Button
          variant="primary"
          size="icon"
          aria-label={t(locale, "save")}
          onClick={() => handleSwipe(deck[0].id, "right")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
          </svg>
        </Button>
      </div>
    </div>
  );
}

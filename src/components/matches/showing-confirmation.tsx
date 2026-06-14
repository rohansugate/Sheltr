"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { useDoorwayStore } from "@/lib/store";

export function ShowingConfirmation() {
  const locale = useDoorwayStore((s) => s.locale);
  const showing = useDoorwayStore((s) => s.lastConfirmedShowing);
  const clearConfirmedShowing = useDoorwayStore((s) => s.clearConfirmedShowing);

  if (!showing) return null;

  const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Sheltr+Showing&dates=${showing.date.replace(/-/g, "")}T${showing.time.replace(":", "")}00/${showing.date.replace(/-/g, "")}T${showing.time.replace(":", "")}00`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-6">
      <div className="app-shell w-full rounded-2xl bg-background p-6">
        <h2 className="text-2xl font-bold text-primary">{t(locale, "showingAccepted")}</h2>
        <p className="mt-2 text-muted-foreground">{t(locale, "showingConfirmedMsg")}</p>
        <p className="mt-4 font-semibold">{showing.date} at {showing.time}</p>
        {showing.landlordMessage && (
          <p className="mt-2 text-sm text-muted-foreground">{showing.landlordMessage}</p>
        )}
        <div className="mt-6 flex flex-col gap-3">
          <a href={calUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="primary" size="lg" className="w-full">{t(locale, "addToCalendar")}</Button>
          </a>
          <Link href={`/messages?conversationId=convo-showing-${showing.id}`}>
            <Button variant="outline" size="lg" className="w-full">Message landlord</Button>
          </Link>
          <Button variant="outline" size="lg" className="w-full" onClick={clearConfirmedShowing}>Close</Button>
        </div>
      </div>
    </div>
  );
}

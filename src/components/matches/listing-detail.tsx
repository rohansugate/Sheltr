"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ListingImage } from "@/components/ui/listing-image";
import { t } from "@/lib/i18n";
import type { ApplicationPacket, ContactMethod, Listing, Locale, Showing } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

type DetailMode = "view" | "apply" | "showing";

interface ListingDetailProps {
  listing: Listing;
  locale: Locale;
  showing?: Showing;
  canApply: boolean;
  onClose: () => void;
  onApply: (packet: ApplicationPacket) => boolean;
  onScheduleShowing: (
    date: string,
    time: string,
    contactMethod: ContactMethod,
    contactValue: string,
  ) => void;
}

export function ListingDetail({
  listing,
  locale,
  showing,
  canApply,
  onClose,
  onApply,
  onScheduleShowing,
}: ListingDetailProps) {
  const [mode, setMode] = useState<DetailMode>("view");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [packet, setPacket] = useState<ApplicationPacket>({
    voucherSize: 2,
    maxRent: 1600,
    voucherCaseNumber: "",
    employment: "",
    references: "",
    notes: "",
  });
  const [showingDate, setShowingDate] = useState("");
  const [showingTime, setShowingTime] = useState("10:00");
  const [contactMethod, setContactMethod] = useState<ContactMethod>("phone");
  const [contactValue, setContactValue] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" role="dialog" aria-modal="true" aria-label={listing.title}>
      <div className="app-shell flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-background sm:rounded-3xl">
        <div className="relative h-56 shrink-0 bg-muted">
          <ListingImage src={listing.images[photoIndex] ?? listing.images[0]} alt={listing.title} fill className="object-cover" sizes="430px" />
          <button type="button" onClick={onClose} className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-black/50 text-white" aria-label="Close">✕</button>
        </div>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
          {mode === "view" && (
            <>
              <div>
                <h2 className="text-2xl font-bold">{listing.title}</h2>
                <p className="text-lg font-bold text-primary">{formatCurrency(listing.monthlyRent)}/mo</p>
                <p className="text-sm text-muted-foreground">{listing.bedrooms} bed · {listing.neighborhood}, {listing.zipCode}</p>
              </div>
              {showing && (
                <Badge variant={showing.status === "ACCEPTED" ? "success" : "outline"}>
                  {showing.status === "ACCEPTED"
                    ? t(locale, "showingAccepted")
                    : t(locale, "showingPending")}
                </Badge>
              )}
              <div className="mt-auto flex flex-col gap-3 pt-2">
                {!showing || showing.status === "DECLINED" ? (
                  <Button variant="outline" size="lg" onClick={() => setMode("showing")}>
                    {t(locale, "scheduleShowing")}
                  </Button>
                ) : null}
                <Button
                  variant="primary"
                  size="lg"
                  disabled={!canApply}
                  onClick={() => (canApply ? setMode("apply") : undefined)}
                >
                  {canApply ? t(locale, "apply") : t(locale, "applyAfterShowing")}
                </Button>
              </div>
            </>
          )}
          {mode === "apply" && (
            <>
              <h3 className="text-xl font-bold">Application packet</h3>
              <Input label={t(locale, "voucherCaseNumber")} value={packet.voucherCaseNumber} onChange={(e) => setPacket({ ...packet, voucherCaseNumber: e.target.value })} required />
              <Input label="Employment" value={packet.employment} onChange={(e) => setPacket({ ...packet, employment: e.target.value })} required />
              <Input label="References" value={packet.references} onChange={(e) => setPacket({ ...packet, references: e.target.value })} required />
              <div className="flex gap-3 pt-2">
                <Button variant="outline" size="lg" className="flex-1" onClick={() => setMode("view")}>Back</Button>
                <Button variant="primary" size="lg" className="flex-1" disabled={!packet.employment || !packet.references || !packet.voucherCaseNumber} onClick={() => { if (onApply(packet)) onClose(); }}>Submit</Button>
              </div>
            </>
          )}
          {mode === "showing" && (
            <>
              <h3 className="text-xl font-bold">{t(locale, "scheduleShowing")}</h3>
              <Input label="Date" type="date" value={showingDate} onChange={(e) => setShowingDate(e.target.value)} required />
              <Input label="Time" type="time" value={showingTime} onChange={(e) => setShowingTime(e.target.value)} required />
              <p className="text-sm font-semibold">{t(locale, "contactMethod")}</p>
              <div className="flex gap-2">
                <Button variant={contactMethod === "phone" ? "primary" : "outline"} size="sm" className="flex-1" onClick={() => setContactMethod("phone")}>{t(locale, "phone")}</Button>
                <Button variant={contactMethod === "email" ? "primary" : "outline"} size="sm" className="flex-1" onClick={() => setContactMethod("email")}>{t(locale, "email")}</Button>
              </div>
              <Input label={contactMethod === "phone" ? "Phone number" : "Email address"} value={contactValue} onChange={(e) => setContactValue(e.target.value)} required />
              <div className="flex gap-3 pt-2">
                <Button variant="outline" size="lg" className="flex-1" onClick={() => setMode("view")}>Back</Button>
                <Button variant="primary" size="lg" className="flex-1" disabled={!showingDate || !contactValue} onClick={() => { onScheduleShowing(showingDate, showingTime, contactMethod, contactValue); onClose(); }}>Confirm</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

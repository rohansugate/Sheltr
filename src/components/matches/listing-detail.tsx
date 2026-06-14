"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    const scrollY = window.scrollY;
    const { style } = document.body;
    const prev = {
      position: style.position,
      top: style.top,
      left: style.left,
      right: style.right,
      overflow: style.overflow,
      width: style.width,
    };

    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.left = "0";
    style.right = "0";
    style.overflow = "hidden";
    style.width = "100%";

    return () => {
      style.position = prev.position;
      style.top = prev.top;
      style.left = prev.left;
      style.right = prev.right;
      style.overflow = prev.overflow;
      style.width = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, []);

  const canConfirmShowing =
    showingDate.trim().length > 0 && contactValue.trim().length > 0;

  const handleConfirmShowing = () => {
    if (!canConfirmShowing) return;
    onScheduleShowing(
      showingDate,
      showingTime,
      contactMethod,
      contactValue.trim(),
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={listing.title}
      onClick={onClose}
    >
      <div
        className="app-shell flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-background sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {mode === "view" ? (
          <div className="relative h-56 shrink-0 bg-muted">
            <ListingImage
              src={listing.images[photoIndex] ?? listing.images[0]}
              alt={listing.title}
              fill
              className="object-cover"
              sizes="430px"
            />
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-black/50 text-white"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
            <h3 className="text-xl font-bold">
              {mode === "showing"
                ? t(locale, "scheduleShowing")
                : "Application packet"}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-5 py-4 [-webkit-overflow-scrolling:touch]">
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
              <Input label={t(locale, "voucherCaseNumber")} value={packet.voucherCaseNumber} onChange={(e) => setPacket({ ...packet, voucherCaseNumber: e.target.value })} required />
              <Input label="Employment" value={packet.employment} onChange={(e) => setPacket({ ...packet, employment: e.target.value })} required />
              <Input label="References" value={packet.references} onChange={(e) => setPacket({ ...packet, references: e.target.value })} required />
            </>
          )}
          {mode === "showing" && (
            <>
              <Input label="Date" type="date" value={showingDate} onChange={(e) => setShowingDate(e.target.value)} required />
              <Input label="Time" type="time" value={showingTime} onChange={(e) => setShowingTime(e.target.value)} required />
              <p className="text-sm font-semibold">{t(locale, "contactMethod")}</p>
              <div className="flex gap-2">
                <Button type="button" variant={contactMethod === "phone" ? "primary" : "outline"} size="sm" className="flex-1" onClick={() => setContactMethod("phone")}>{t(locale, "phone")}</Button>
                <Button type="button" variant={contactMethod === "email" ? "primary" : "outline"} size="sm" className="flex-1" onClick={() => setContactMethod("email")}>{t(locale, "email")}</Button>
              </div>
              <Input label={contactMethod === "phone" ? "Phone number" : "Email address"} value={contactValue} onChange={(e) => setContactValue(e.target.value)} required inputMode={contactMethod === "phone" ? "tel" : "email"} />
            </>
          )}
        </div>
        {mode === "apply" && (
          <div
            className="flex shrink-0 gap-3 border-t border-border px-5 py-4"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setMode("view")}>
              Back
            </Button>
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="flex-1"
              disabled={!packet.employment || !packet.references || !packet.voucherCaseNumber}
              onClick={() => {
                if (onApply(packet)) onClose();
              }}
            >
              Submit
            </Button>
          </div>
        )}
        {mode === "showing" && (
          <div
            className="flex shrink-0 gap-3 border-t border-border px-5 py-4"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setMode("view")}>
              Back
            </Button>
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="flex-1"
              disabled={!canConfirmShowing}
              onClick={handleConfirmShowing}
            >
              Confirm
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

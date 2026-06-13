"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ListingForm } from "@/components/landlord/listing-form";
import { useDoorwayStore } from "@/lib/store";

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const listing = useDoorwayStore((s) => s.listings.find((l) => l.id === id));

  useEffect(() => {
    if (!listing) router.replace("/landlord");
  }, [listing, router]);

  if (!listing) return null;

  return (
    <div className="app-shell flex min-h-dvh flex-col">
      <header className="flex items-center gap-3 border-b border-border px-5 py-4">
        <Link
          href="/landlord"
          className="touch-target flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground"
          aria-label="Back to listings"
        >
          ← Back
        </Link>
        <h1 className="text-xl font-bold">Edit Listing</h1>
      </header>
      <ListingForm
        mode="edit"
        listingId={id}
        initialStatus={listing.status === "DRAFT" ? "DRAFT" : "ACTIVE"}
      />
    </div>
  );
}

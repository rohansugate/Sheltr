"use client";

import Link from "next/link";
import { ListingForm } from "@/components/landlord/listing-form";

export default function AddListingPage() {
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
        <h1 className="text-xl font-bold">Add Listing</h1>
      </header>
      <ListingForm mode="create" />
    </div>
  );
}

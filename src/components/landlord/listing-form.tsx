"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListingImage } from "@/components/ui/listing-image";
import { compressImageFile } from "@/lib/image-utils";
import { CA_TRANSIT_OPTIONS, neighborhoodsForZip } from "@/lib/neighborhoods";
import { useDoorwayStore } from "@/lib/store";
import type { Listing, ListingInput } from "@/lib/types";

const DEFAULT_FORM: ListingInput = {
  title: "",
  monthlyRent: 1200,
  bedrooms: 2,
  bathrooms: 1,
  zipCode: "",
  neighborhood: "",
  transitLines: [],
  isGroundFloor: false,
  isSection8Approved: true,
  images: [],
};

function listingToForm(listing: Listing): ListingInput {
  return {
    title: listing.title,
    monthlyRent: listing.monthlyRent,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    zipCode: listing.zipCode,
    neighborhood: listing.neighborhood ?? "",
    transitLines: listing.transitLines,
    isGroundFloor: listing.isGroundFloor,
    isSection8Approved: listing.isSection8Approved,
    images: listing.images.filter((img) => img.startsWith("data:")),
  };
}

interface ListingFormProps {
  mode: "create" | "edit";
  listingId?: string;
  initialStatus?: "DRAFT" | "ACTIVE";
}

export function ListingForm({
  mode,
  listingId,
  initialStatus,
}: ListingFormProps) {
  const router = useRouter();
  const listings = useDoorwayStore((s) => s.listings);
  const saveListing = useDoorwayStore((s) => s.saveListing);
  const updateListing = useDoorwayStore((s) => s.updateListing);
  const publishListing = useDoorwayStore((s) => s.publishListing);

  const existing = listingId
    ? listings.find((l) => l.id === listingId)
    : undefined;
  const [form, setForm] = useState<ListingInput>(
    existing ? listingToForm(existing) : DEFAULT_FORM,
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof ListingInput, string>>
  >({});
  const [photos, setPhotos] = useState<string[]>(
    existing?.images ?? [],
  );
  const [uploading, setUploading] = useState(false);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);

  const onPhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handlePhoto(file);
    e.target.value = "";
    setShowPhotoPicker(false);
  };

  const neighborhoods = useMemo(
    () => neighborhoodsForZip(form.zipCode),
    [form.zipCode],
  );

  const validate = () => {
    const next: Partial<Record<keyof ListingInput, string>> = {};
    if (!form.title.trim()) next.title = "Title is required";
    if (form.monthlyRent < 300 || form.monthlyRent > 5000)
      next.monthlyRent = "Enter a rent between $300 and $5,000";
    if (!/^\d{5}$/.test(form.zipCode))
      next.zipCode = "Enter a 5-digit zip code";
    if (!form.neighborhood) next.neighborhood = "Select a neighborhood";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePhoto = async (file: File) => {
    if (photos.length >= 5) return;
    setUploading(true);
    try {
      const dataUrl = await compressImageFile(file);
      setPhotos((prev) => [...prev, dataUrl].slice(0, 5));
    } finally {
      setUploading(false);
    }
  };

  const submit = (asDraft: boolean) => {
    if (!validate()) return;
    const payload: ListingInput = {
      ...form,
      images: photos.filter((p) => p.startsWith("data:")),
    };

    if (mode === "create") {
      const result = saveListing(payload, asDraft ? "DRAFT" : "ACTIVE");
      if (!result) {
        setErrors({ title: "Sign in as a landlord to publish listings." });
        return;
      }
    } else if (listingId) {
      const ok = updateListing(listingId, payload);
      if (!ok) {
        setErrors({ title: "Could not save this listing. Try again." });
        return;
      }
      if (!asDraft && existing?.status === "DRAFT") {
        publishListing(listingId);
      }
    }

    router.push("/landlord");
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(false);
      }}
      className="flex flex-1 flex-col gap-5 px-5 py-6"
    >
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold">
          Photos ({photos.length}/5)
        </span>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((src, i) => (
            <div key={i} className="relative size-20 shrink-0 overflow-hidden rounded-xl">
              <ListingImage src={src} alt="" fill className="object-cover" />
              <button
                type="button"
                className="absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-black/60 text-xs text-white"
                onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                aria-label="Remove photo"
              >
                ✕
              </button>
            </div>
          ))}
          {photos.length < 5 && (
            <button
              type="button"
              onClick={() => setShowPhotoPicker(true)}
              disabled={uploading}
              className="flex size-20 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-border text-xs text-muted-foreground disabled:opacity-50"
            >
              {uploading ? "…" : "+ Add"}
            </button>
          )}
        </div>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={onPhotoFile}
        />
        <input
          ref={libraryRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={onPhotoFile}
        />
        {showPhotoPicker && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            onClick={() => setShowPhotoPicker(false)}
          >
            <div
              className="w-full max-w-md overflow-hidden rounded-2xl bg-background shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="border-b border-border px-4 py-3 text-center text-sm font-semibold">
                Add listing photo
              </p>
              <button
                type="button"
                className="flex w-full items-center gap-3 border-b border-border px-4 py-4 text-left text-sm font-medium hover:bg-muted"
                onClick={() => cameraRef.current?.click()}
              >
                <span className="text-lg" aria-hidden>
                  📷
                </span>
                Take Photo
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-3 border-b border-border px-4 py-4 text-left text-sm font-medium hover:bg-muted"
                onClick={() => libraryRef.current?.click()}
              >
                <span className="text-lg" aria-hidden>
                  🖼️
                </span>
                Choose from Photos
              </button>
              <button
                type="button"
                className="w-full px-4 py-4 text-center text-sm font-medium text-muted-foreground hover:bg-muted"
                onClick={() => setShowPhotoPicker(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <Input
        label="Listing title"
        placeholder="e.g. Sunny 2BR Near Transit"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        error={errors.title}
        required
      />

      <Input
        label="Monthly rent ($)"
        type="number"
        min={300}
        max={5000}
        value={form.monthlyRent}
        onChange={(e) =>
          setForm({ ...form, monthlyRent: Number(e.target.value) })
        }
        error={errors.monthlyRent}
        required
      />

      <div className="flex gap-3">
        <BedBathPicker
          label="Bedrooms"
          values={[1, 2, 3, 4]}
          selected={form.bedrooms}
          onSelect={(n) => setForm({ ...form, bedrooms: n })}
        />
        <BedBathPicker
          label="Bathrooms"
          values={[1, 2, 3]}
          selected={form.bathrooms}
          onSelect={(n) => setForm({ ...form, bathrooms: n })}
        />
      </div>

      <Input
        label="Zip code"
        placeholder="90026"
        inputMode="numeric"
        maxLength={5}
        value={form.zipCode}
        onChange={(e) => {
          const zipCode = e.target.value.replace(/\D/g, "");
          const hoods = neighborhoodsForZip(zipCode);
          setForm({
            ...form,
            zipCode,
            neighborhood: hoods.includes(form.neighborhood)
              ? form.neighborhood
              : "",
          });
        }}
        error={errors.zipCode}
        required
      />

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Neighborhood</span>
        <div className="flex flex-wrap gap-2">
          {neighborhoods.map((hood) => (
            <Button
              key={hood}
              type="button"
              variant={form.neighborhood === hood ? "primary" : "outline"}
              size="sm"
              onClick={() => setForm({ ...form, neighborhood: hood })}
              aria-pressed={form.neighborhood === hood}
            >
              {hood}
            </Button>
          ))}
        </div>
        {errors.neighborhood && (
          <p className="text-sm text-destructive">{errors.neighborhood}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Transit & nearby</span>
        <div className="flex flex-wrap gap-2">
          {CA_TRANSIT_OPTIONS.map((t) => {
            const selected = form.transitLines.includes(t);
            return (
              <Button
                key={t}
                type="button"
                variant={selected ? "primary" : "outline"}
                size="sm"
                onClick={() =>
                  setForm({
                    ...form,
                    transitLines: selected
                      ? form.transitLines.filter((x) => x !== t)
                      : [...form.transitLines, t],
                  })
                }
              >
                {t}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <ToggleRow
          label="Ground floor unit"
          description="For accessibility filtering"
          checked={form.isGroundFloor}
          onChange={(checked) => setForm({ ...form, isGroundFloor: checked })}
        />
        <ToggleRow
          label="Section 8 approved"
          description="Shows badge to voucher holders"
          checked={form.isSection8Approved}
          onChange={(checked) =>
            setForm({ ...form, isSection8Approved: checked })
          }
        />
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-4">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="flex-1"
            disabled={uploading}
          >
            {mode === "edit" && initialStatus === "DRAFT"
              ? "Publish"
              : mode === "edit"
                ? "Save Changes"
                : "Publish Listing"}
          </Button>
        </div>
        {(mode === "create" || initialStatus === "DRAFT") && (
          <Button
            type="button"
            variant="ghost"
            size="md"
            className="w-full"
            disabled={uploading}
            onClick={() => submit(true)}
          >
            Save as Draft
          </Button>
        )}
      </div>
    </form>
  );
}

function BedBathPicker({
  label,
  values,
  selected,
  onSelect,
}: {
  label: string;
  values: number[];
  selected: number;
  onSelect: (n: number) => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <span className="text-sm font-semibold">{label}</span>
      <div className="flex gap-2">
        {values.map((n) => (
          <Button
            key={n}
            type="button"
            variant={selected === n ? "primary" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => onSelect(n)}
            aria-pressed={selected === n}
          >
            {n}
          </Button>
        ))}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between rounded-xl border-2 border-border p-4 text-left transition-colors hover:bg-muted"
    >
      <div>
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-border"
        }`}
      >
        <div
          className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </div>
    </button>
  );
}

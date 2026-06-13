"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { mockLandlord } from "@/lib/mock-data";
import { useDoorwayStore } from "@/lib/store";
import type { UserRole } from "@/lib/types";

const ROLE_CONFIG: Record<
  "SEEKER" | "LANDLORD",
  { label: string; other: string; otherRole: UserRole; href: string }
> = {
  SEEKER: {
    label: "Tenant",
    other: "Landlord",
    otherRole: "LANDLORD",
    href: "/landlord",
  },
  LANDLORD: {
    label: "Landlord",
    other: "Tenant",
    otherRole: "SEEKER",
    href: "/discover",
  },
};

export function RoleSwitcher({ compact }: { compact?: boolean }) {
  const router = useRouter();
  const role = useDoorwayStore((s) => s.role);
  const setRole = useDoorwayStore((s) => s.setRole);

  if (role !== "SEEKER" && role !== "LANDLORD") return null;

  const config = ROLE_CONFIG[role];

  const switchRole = () => {
    setRole(config.otherRole);
    router.push(config.href);
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={switchRole}
        className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        Switch to {config.other}
      </button>
    );
  }

  return (
    <div className="mx-5 mb-4 rounded-2xl border border-border bg-surface px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Demo mode
          </p>
          <p className="text-sm">
            Viewing as <span className="font-semibold">{config.label}</span>
            {role === "LANDLORD" && (
              <span className="text-muted-foreground">
                {" "}
                · {mockLandlord.firstName} {mockLandlord.lastName}
              </span>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0 rounded-full" onClick={switchRole}>
          {config.other} view
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Same data on both sides. On Vercel, open the same deployment URL on two phones — listings,
        applications, and messages sync automatically.
      </p>
    </div>
  );
}

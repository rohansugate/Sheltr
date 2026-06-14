"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LandlordShell } from "@/components/layout/landlord-shell";
import { DoorwayHeader } from "@/components/layout/doorway-header";
import { RoleSwitcher } from "@/components/layout/role-switcher";
import { Button } from "@/components/ui/button";
import { displayName, initials, resolveLandlord } from "@/lib/current-user";
import { signOutAccount, switchAccount } from "@/lib/auth-client";
import { useDoorwayStore } from "@/lib/store";

const ROLES = [
  { role: "SEEKER" as const, label: "Tenant view", href: "/discover" },
  { role: "LANDLORD" as const, label: "Landlord view", href: "/landlord" },
];

export default function LandlordProfilePage() {
  const router = useRouter();
  const currentUser = useDoorwayStore((s) => s.currentUser);
  const landlord = resolveLandlord(currentUser);
  const setRole = useDoorwayStore((s) => s.setRole);

  return (
    <LandlordShell>
      <DoorwayHeader subtitle="You" />

      <div className="px-5 pb-2">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-foreground text-xl font-medium text-background">
            {initials(landlord)}
          </div>
          <div>
            <p className="font-medium">{displayName(landlord)}</p>
            <p className="text-sm text-muted-foreground">
              {currentUser ? "Landlord account" : "Landlord (demo)"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-5 pb-8">
        {currentUser && (
          <section className="rounded-2xl border border-border p-4">
            <h2 className="mb-2 font-bold">Account</h2>
            <p className="mb-3 text-sm text-muted-foreground">
              Need the tenant side? Switch accounts and sign in with a tenant
              account, or create a new one.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-full"
              onClick={() => switchAccount({ role: "SEEKER", mode: "login" })}
            >
              Switch account
            </Button>
          </section>
        )}

        {!currentUser && (
          <section className="rounded-2xl border border-border p-4">
            <h2 className="mb-3 font-bold">Switch role</h2>
            <div className="flex gap-2">
              {ROLES.map((r) => (
                <Button
                  key={r.role}
                  variant={r.role === "LANDLORD" ? "primary" : "outline"}
                  size="sm"
                  className="flex-1 rounded-full"
                  onClick={() => {
                    setRole(r.role);
                    router.push(r.href);
                  }}
                >
                  {r.label}
                </Button>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-border p-4">
          <h2 className="mb-3 font-bold">Account</h2>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-semibold">{landlord.email ?? "—"}</dd>
            </div>
          </dl>
        </section>

        <Button
          variant="ghost"
          size="md"
          className="text-destructive"
          onClick={async () => {
            if (currentUser) {
              await signOutAccount();
              window.location.href = "/auth";
              return;
            }
            router.push("/");
          }}
        >
          Sign out
        </Button>

        <Link href="/">
          <Button variant="outline" size="md" className="w-full rounded-full">
            Back to home
          </Button>
        </Link>
      </div>
    </LandlordShell>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { DoorwayHeader } from "@/components/layout/doorway-header";
import { Button } from "@/components/ui/button";
import { displayName, initials, resolveSeeker } from "@/lib/current-user";
import { signOutAccount } from "@/lib/auth-client";
import { LOCALE_LABELS, t } from "@/lib/i18n";
import { useDoorwayStore } from "@/lib/store";
import type { Locale } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const ROLES: { role: "SEEKER" | "LANDLORD"; label: string; href: string }[] = [
  { role: "SEEKER", label: "Seeker", href: "/discover" },
  { role: "LANDLORD", label: "Landlord", href: "/landlord" },
];

export default function ProfilePage() {
  const router = useRouter();
  const currentUser = useDoorwayStore((s) => s.currentUser);
  const seeker = resolveSeeker(currentUser);
  const constraints = useDoorwayStore((s) => s.constraints);
  const likedListings = useDoorwayStore((s) => s.likedListings);
  const matches = useDoorwayStore((s) => s.matches);
  const notifications = useDoorwayStore((s) => s.notifications);
  const locale = useDoorwayStore((s) => s.locale);
  const setLocale = useDoorwayStore((s) => s.setLocale);
  const a11y = useDoorwayStore((s) => s.a11y);
  const role = useDoorwayStore((s) => s.role);
  const setDarkMode = useDoorwayStore((s) => s.setDarkMode);
  const darkMode = useDoorwayStore((s) => s.darkMode);
  const setA11y = useDoorwayStore((s) => s.setA11y);
  const setRole = useDoorwayStore((s) => s.setRole);
  const markNotificationRead = useDoorwayStore((s) => s.markNotificationRead);
  const reset = useDoorwayStore((s) => s.reset);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <AppShell>
      <DoorwayHeader subtitle="You" />

      <div className="px-5 pb-2">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-foreground text-xl font-medium text-background">
            {initials(seeker)}
          </div>
          <div>
            <p className="font-medium">{displayName(seeker)}</p>
            <p className="text-sm text-muted-foreground">
              {currentUser ? "Tenant account" : "Voucher Holder (demo)"}
            </p>
            {currentUser?.email && (
              <p className="text-xs text-muted-foreground">{currentUser.email}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-5 pb-8">
        {!currentUser && (
          <section className="rounded-2xl border border-border p-4">
            <h2 className="mb-3 font-bold">{t(locale, "switchRole")}</h2>
            <div className="flex gap-2">
              {ROLES.map((r) => (
                <Button
                  key={r.role}
                  variant={role === r.role ? "primary" : "outline"}
                  size="sm"
                  className="flex-1"
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
          <h2 className="mb-3 font-bold">{t(locale, "darkMode")}</h2>
          <Button
            variant={darkMode ? "primary" : "outline"}
            size="sm"
            className="w-full"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "On" : "Off"}
          </Button>
        </section>

        <section className="rounded-2xl border border-border p-4">
          <h2 className="mb-3 font-bold">{t(locale, "language")}</h2>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(LOCALE_LABELS) as Locale[]).map((l) => (
              <Button
                key={l}
                variant={locale === l ? "primary" : "outline"}
                size="sm"
                onClick={() => setLocale(l)}
              >
                {LOCALE_LABELS[l]}
              </Button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border p-4">
          <h2 className="mb-3 font-bold">{t(locale, "accessibility")}</h2>
          <div className="flex flex-col gap-2">
            <Toggle label={t(locale, "largeText")} checked={a11y.largeText} onChange={(v) => setA11y({ largeText: v })} />
            <Toggle label={t(locale, "highContrast")} checked={a11y.highContrast} onChange={(v) => setA11y({ highContrast: v })} />
            <Toggle label={t(locale, "reduceMotion")} checked={a11y.reduceMotion} onChange={(v) => setA11y({ reduceMotion: v })} />
          </div>
        </section>

        <section className="rounded-2xl border border-border p-4">
          <h2 className="mb-3 font-bold">
            {t(locale, "notifications")} {unread > 0 && `(${unread})`}
          </h2>
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {notifications.slice(0, 5).map((n) => (
                <li
                  key={n.id}
                  className={`rounded-lg p-3 text-sm ${n.read ? "bg-muted" : "bg-primary/10"}`}
                >
                  <p className="font-semibold">{n.title}</p>
                  <p className="text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    via {n.channels.join(", ")}
                  </p>
                  {!n.read && (
                    <button
                      type="button"
                      className="mt-1 text-xs font-semibold text-primary"
                      onClick={() => markNotificationRead(n.id)}
                    >
                      Mark read
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border p-4">
          <h2 className="mb-3 font-bold">Your Preferences</h2>
          {constraints ? (
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Bedrooms</dt>
                <dd className="font-semibold">{constraints.voucherSize}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Max rent</dt>
                <dd className="font-semibold">{formatCurrency(constraints.maxRent)}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Complete onboarding first.</p>
          )}
          <Link href="/onboarding" className="mt-4 block">
            <Button variant="outline" size="sm" className="w-full">
              Edit Preferences
            </Button>
          </Link>
        </section>

        <section className="rounded-2xl border border-border p-4">
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Saved matches</dt>
              <dd className="font-semibold">{likedListings.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Total swipes</dt>
              <dd className="font-semibold">{matches.length}</dd>
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
            reset();
            window.location.href = "/";
          }}
        >
          Sign out
        </Button>
      </div>
    </AppShell>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
    >
      {label}
      <span className={`size-5 rounded-full ${checked ? "bg-primary" : "bg-border"}`} />
    </button>
  );
}

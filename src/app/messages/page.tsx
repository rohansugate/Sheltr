"use client";

import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { SheltrHeader } from "@/components/layout/sheltr-header";
import { RoleSwitcher } from "@/components/layout/role-switcher";
import { MessagesPanel } from "@/components/messages/messages-panel";

export default function MessagesPage() {
  return (
    <AppShell>
      <SheltrHeader subtitle="Messages" />
      <RoleSwitcher compact />
      <Suspense fallback={<p className="px-5 text-sm text-muted-foreground">Loading messages…</p>}>
        <MessagesPanel role="SEEKER" />
      </Suspense>
    </AppShell>
  );
}

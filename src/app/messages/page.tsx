"use client";

import { AppShell } from "@/components/layout/app-shell";
import { DoorwayHeader } from "@/components/layout/doorway-header";
import { RoleSwitcher } from "@/components/layout/role-switcher";
import { MessagesPanel } from "@/components/messages/messages-panel";

export default function MessagesPage() {
  return (
    <AppShell>
      <DoorwayHeader subtitle="Messages" />
      <RoleSwitcher compact />
      <MessagesPanel role="SEEKER" />
    </AppShell>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { useDoorwayStore } from "@/lib/store";
import type { Locale } from "@/lib/types";

export function TutorialOverlay() {
  const locale = useDoorwayStore((s) => s.locale);
  const tutorialSeen = useDoorwayStore((s) => s.tutorialSeen);
  const dismissTutorial = useDoorwayStore((s) => s.dismissTutorial);

  if (tutorialSeen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-6 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
    >
      <div className="app-shell w-full rounded-2xl bg-background p-6 shadow-xl">
        <h2 id="tutorial-title" className="text-xl font-bold">
          {t(locale, "tutorialTitle")}
        </h2>
        <p className="mt-2 text-muted-foreground">{t(locale, "tutorialBody")}</p>
        <Button
          variant="primary"
          size="lg"
          className="mt-6 w-full"
          onClick={dismissTutorial}
        >
          {t(locale, "tutorialDismiss")}
        </Button>
      </div>
    </div>
  );
}

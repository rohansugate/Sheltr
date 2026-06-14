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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
    >
      <div className="flex w-full max-w-sm flex-col items-center rounded-2xl bg-background px-8 py-10 text-center shadow-xl">
        <h2 id="tutorial-title" className="text-xl font-bold">
          {t(locale, "tutorialTitle")}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {t(locale, "tutorialBody")}
        </p>
        <Button
          variant="primary"
          size="lg"
          className="mt-8 w-full"
          onClick={dismissTutorial}
        >
          {t(locale, "tutorialDismiss")}
        </Button>
      </div>
    </div>
  );
}

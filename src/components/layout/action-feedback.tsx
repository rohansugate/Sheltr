"use client";

import { useDoorwayStore } from "@/lib/store";
import { useEffect } from "react";

const AUTO_DISMISS_MS = 4000;

export function ActionFeedbackToast() {
  const feedback = useDoorwayStore((s) => s.uiFeedback);
  const clearUiFeedback = useDoorwayStore((s) => s.clearUiFeedback);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(clearUiFeedback, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [feedback, clearUiFeedback]);

  if (!feedback) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[80] flex justify-center px-4">
      <div
        role="status"
        className={`pointer-events-auto w-full max-w-md rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg ${
          feedback.type === "error"
            ? "border-destructive/30 bg-destructive text-destructive-foreground"
            : "border-primary/30 bg-primary text-primary-foreground"
        }`}
      >
        {feedback.message}
      </div>
    </div>
  );
}

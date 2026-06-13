"use client";

import { useEffect } from "react";
import { useDoorwayStore } from "@/lib/store";

export function A11yProvider({ children }: { children: React.ReactNode }) {
  const a11y = useDoorwayStore((s) => s.a11y);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("a11y-large-text", a11y.largeText);
    root.classList.toggle("a11y-high-contrast", a11y.highContrast);
    root.classList.toggle("a11y-reduce-motion", a11y.reduceMotion);
  }, [a11y]);

  return <>{children}</>;
}

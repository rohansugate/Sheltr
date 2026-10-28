"use client";

import { useEffect } from "react";
import { useSheltrStore } from "@/lib/store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const darkMode = useSheltrStore((s) => s.darkMode);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return <>{children}</>;
}

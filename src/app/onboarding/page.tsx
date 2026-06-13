"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { useDoorwayStore } from "@/lib/store";

export default function OnboardingPage() {
  const router = useRouter();
  const { onboardingComplete } = useDoorwayStore();

  useEffect(() => {
    if (onboardingComplete) {
      router.replace("/discover");
    }
  }, [onboardingComplete, router]);

  return (
    <div className="app-shell doorway-gradient flex min-h-dvh flex-col">
      <OnboardingForm />
    </div>
  );
}

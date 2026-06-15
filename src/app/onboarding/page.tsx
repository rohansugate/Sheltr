"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { useDoorwayStore } from "@/lib/store";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editMode = searchParams.get("edit") === "1";
  const onboardingComplete = useDoorwayStore((s) => s.onboardingComplete);

  useEffect(() => {
    if (onboardingComplete && !editMode) {
      router.replace("/discover");
    }
  }, [onboardingComplete, editMode, router]);

  if (onboardingComplete && !editMode) return null;

  return <OnboardingForm editMode={editMode} />;
}

export default function OnboardingPage() {
  return (
    <div className="app-shell doorway-gradient flex min-h-dvh flex-col">
      <Suspense fallback={null}>
        <OnboardingContent />
      </Suspense>
    </div>
  );
}

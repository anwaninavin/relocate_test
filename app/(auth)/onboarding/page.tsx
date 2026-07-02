import type { Metadata } from "next";

import { OnboardingForm } from "@/features/auth/onboarding-form";

export const metadata: Metadata = {
  title: "Set up your profile — Pack with Me",
};

export default function OnboardingPage() {
  return <OnboardingForm />;
}

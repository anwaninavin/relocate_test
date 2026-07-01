import type { Metadata } from "next";

import { LoginForm } from "@/features/auth/login-form";
import { SplashScreen } from "@/components/shared/splash-screen";

export const metadata: Metadata = {
  title: "Log in — Hostel Essentials",
};

export default function LoginPage() {
  return (
    <>
      <SplashScreen />
      <LoginForm />
    </>
  );
}

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { HOME_ROUTE } from "@/lib/nav-items";
import { SplashScreen } from "@/components/shared/splash-screen";
import { MoodboardView } from "@/features/welcome/moodboard-view";

export default async function RootPage() {
  const session = await auth();

  if (session?.user) {
    redirect(HOME_ROUTE);
  }

  return (
    <>
      <SplashScreen />
      <MoodboardView />
    </>
  );
}

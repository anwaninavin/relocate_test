import { useEffect, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { api, peekCache } from "@/lib/api";
import { TravelProfileForm } from "@/features/discovery/travel-profile-form";
import { RoommateView } from "@/features/discovery/roommate-view";
import { ConnectionsView } from "@/features/discovery/connections-view";
import { type TravelProfileRaw } from "@/features/discovery/discovery-dto";

const DISCOVERY_PROFILE_PATH = "/api/discovery/profile";

export default function FindARoomiePage() {
  const cachedProfile = peekCache<{ profile: TravelProfileRaw | null }>(DISCOVERY_PROFILE_PATH);
  const [hasProfile, setHasProfile] = useState(() => Boolean(cachedProfile?.profile));
  const [loaded, setLoaded] = useState(() => cachedProfile !== undefined);
  const [tab, setTab] = useState("matches");

  useEffect(() => {
    api
      .get<{ profile: TravelProfileRaw | null }>(DISCOVERY_PROFILE_PATH)
      .then(({ profile }) => setHasProfile(Boolean(profile)))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return null;

  return (
    <div>
      <PageHeader
        title="Find a Roomie"
        description="Match with students moving to your destination city, then start chatting"
      />

      <Tabs value={tab} onValueChange={setTab} className="flex flex-col gap-6">
        <TabsList className="flex-wrap overflow-x-auto">
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="profile">My Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="matches">
          <RoommateView hasProfile={hasProfile} onEditProfile={() => setTab("profile")} />
        </TabsContent>
        <TabsContent value="requests">
          <ConnectionsView context="roommate" />
        </TabsContent>
        <TabsContent value="profile">
          <TravelProfileForm
            onSaved={() => {
              setHasProfile(true);
              // Saving from the empty state is only ever a means to an end — drop them back on
              // the matches they came here for rather than leaving them staring at the form.
              setTab("matches");
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

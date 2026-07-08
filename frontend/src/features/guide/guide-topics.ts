/** The Hostel Survival Guide's topic sections — shared between the nav bar rendered on the
 * page itself and global search, which needs to match against more than just the short
 * label since the page's actual content (a static scrapbook layout, not database records)
 * isn't otherwise indexed anywhere. */
export interface GuideTopic {
  id: string;
  label: string;
  keywords: string;
}

export const GUIDE_TOPICS: GuideTopic[] = [
  { id: "mental-prep", label: "Mental Prep", keywords: "homesickness first week awkward isolate mental prep get your head right" },
  { id: "room-setup", label: "Room Setup", keywords: "bed near plug extension board organizer room setup strategy" },
  { id: "electronics", label: "Power & Gadgets", keywords: "charging war chargers power bank gadgets electronics" },
  { id: "bathroom", label: "Bathroom", keywords: "peak hours slippers bucket toiletry kit bathroom survival" },
  { id: "laundry", label: "Clothing & Laundry", keywords: "laundry system clothes outfits washing" },
  { id: "food", label: "Food", keywords: "maggi noodles snack stash meals food survival" },
  { id: "roommates", label: "Roommates", keywords: "roommate respect boundaries communicate dynamics" },
  { id: "hygiene", label: "Hygiene", keywords: "bedsheets clean space desk hygiene weekly reset" },
  { id: "safety", label: "Safety", keywords: "lock belongings overshare emergency contacts safety first" },
  { id: "routine", label: "Routine", keywords: "wake up time study work block chill daily routine" },
  { id: "social", label: "Social Life", keywords: "friends toxic groups social life" },
  { id: "money", label: "Money", keywords: "budget spend cash emergency money management" },
  { id: "essentials", label: "Essentials", keywords: "sewing kit medicine kit locks mirror cloth clips underrated essentials" },
];

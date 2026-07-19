import { Link } from "react-router-dom";

import { useAuth } from "@/context/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { emitComingSoon } from "@/lib/coming-soon-bus";
import { HUB_CARDS } from "@/features/welcome/hub-widget-registry";
import { useHubLayout } from "@/features/welcome/use-hub-layout";

/** One distinct pastel per note so the board reads as a set of colorful pinned notes. */
const CARD_BACKGROUNDS = [
  "#FFD9E8", // pastel pink
  "#FFE8C7", // pastel peach
  "#FFF6BA", // pastel lemon
  "#D9F5D6", // pastel mint
  "#CFF3EC", // pastel seafoam
  "#CFEAFF", // pastel sky
  "#D9DFFF", // pastel periwinkle
  "#E6D9FF", // pastel lavender
  "#FFD9D9", // pastel blush
];

/** Small alternating tilts so notes read as hand-pinned rather than machine-aligned. */
const CARD_ROTATIONS = [-3, 2.5, -2, 3, -3.5, 2, -2.5, 3.5, -2];
const PIN_ROTATIONS = [-8, 6, -4, 7, -6, 5, -5, 8, -3];

/** Only ever seen once per browser (the first load, before any layout is cached), so this is a
 * neutral "cards are coming" placeholder rather than an attempt to guess the real count — which
 * is precisely the guess that used to be wrong and visibly correct itself. */
const SKELETON_CARD_COUNT = 6;

export function WaLoginHomeView() {
  const { user } = useAuth();
  const { cards, ready } = useHubLayout();
  const cardsById = new Map(HUB_CARDS.map((card, i) => [card.id, { card, i }]));
  const visibleCards = cards
    .filter((entry) => entry.visible)
    .map((entry) => {
      const found = cardsById.get(entry.id);
      return found ? { ...found, live: entry.live } : undefined;
    })
    .filter((c): c is { card: (typeof HUB_CARDS)[number]; i: number; live: boolean } => c !== undefined);
  const isOddCount = visibleCards.length % 2 === 1;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1
          className="text-5xl font-bold sm:text-6xl"
          style={{ fontFamily: "var(--font-caveat-home)" }}
        >
          {user?.name ? `Hi, ${user.name.split(" ")[0]}!` : "Welcome!"}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3">
        {!ready
          ? Array.from({ length: SKELETON_CARD_COUNT }, (_, i) => (
              <Skeleton
                key={i}
                className="aspect-square rounded-sm"
                style={{ transform: `rotate(${CARD_ROTATIONS[i % CARD_ROTATIONS.length]}deg)` }}
              />
            ))
          : visibleCards.map(({ card, i, live }, displayIndex) => {
              const noteClassName =
                "sticky-note group flex aspect-square flex-col items-center justify-center gap-2 rounded-sm p-4 text-center shadow-[0_1px_1px_rgba(58,46,42,0.06),0_10px_18px_-10px_rgba(58,46,42,0.35)] transition-transform hover:-translate-y-1";
              const noteStyle = {
                background: CARD_BACKGROUNDS[i % CARD_BACKGROUNDS.length],
                transform: `rotate(${CARD_ROTATIONS[i % CARD_ROTATIONS.length]}deg)`,
              };
              const noteContent = (
                <>
                  <span
                    className="sticky-pin"
                    style={{ transform: `translateX(-50%) rotate(${PIN_ROTATIONS[i % PIN_ROTATIONS.length]}deg)` }}
                  >
                    <span className="sticky-pin-head" />
                    <span className="sticky-pin-needle" />
                  </span>
                  <div className="flex size-11 items-center justify-center rounded-xl bg-white/60 shadow-sm">
                    <card.icon className="size-5 text-[#3a2e2a]" />
                  </div>
                  <p
                    className="text-2xl leading-none font-bold text-[#3a2e2a]"
                    style={{ fontFamily: "var(--font-caveat-home)" }}
                  >
                    {card.title}
                  </p>
                </>
              );

              return (
                <div
                  key={card.id}
                  className={
                    isOddCount && displayIndex === visibleCards.length - 1
                      ? "max-md:col-span-2 max-md:mx-auto max-md:w-[calc(50%-0.5rem)]"
                      : undefined
                  }
                >
                  {live ? (
                    <Link to={card.href} className={noteClassName} style={noteStyle}>
                      {noteContent}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => emitComingSoon(card.title)}
                      className={noteClassName}
                      style={noteStyle}
                    >
                      {noteContent}
                    </button>
                  )}
                </div>
              );
            })}
      </div>
    </div>
  );
}

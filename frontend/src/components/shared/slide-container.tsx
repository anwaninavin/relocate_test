import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";

import { useMediaQuery } from "@/lib/use-media-query";

const WHEEL_THRESHOLD = 12; // ignores tiny trackpad jitter
const COOLDOWN_MS = 750; // matches the transition duration — blocks multi-slide skips
const TRANSITION = { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const };

const slideVariants: Variants = {
  enter: (direction: number) => ({ y: direction > 0 ? "6%" : "-6%", opacity: 0 }),
  center: { y: "0%", opacity: 1 },
  exit: (direction: number) => ({ y: direction > 0 ? "-6%" : "6%", opacity: 0 }),
};

function idOf(node: ReactNode): string | null {
  if (typeof node === "object" && node !== null && "props" in node) {
    const props = (node as { props?: { id?: string } }).props;
    return props?.id ?? null;
  }
  return null;
}

/** On desktop (lg breakpoint+), turns its children — one per top-level section — into a
 * locked, one-at-a-time slideshow: wheel/keyboard input advances exactly one slide per
 * gesture (debounced so a long trackpad scroll can't skip several), with a slide+fade
 * transition. Below the breakpoint, renders children unchanged in normal document flow —
 * mobile keeps ordinary scrolling. `activeId`/`onActiveChange` let an external nav (top bar,
 * dot rail) drive and observe the current slide. */
export function SlideContainer({
  children,
  activeId,
  onActiveChange,
  onDesktopChange,
}: {
  children: ReactNode;
  activeId: string;
  onActiveChange: (id: string) => void;
  onDesktopChange?: (isDesktop: boolean) => void;
}) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const slides = useMemo(() => {
    const list = Array.isArray(children) ? children : [children];
    return list.map((node, i) => ({ id: idOf(node) ?? `slide-${i}`, node }));
  }, [children]);

  const index = Math.max(
    0,
    slides.findIndex((s) => s.id === activeId),
  );
  const prevIndexRef = useRef(index);
  const direction = index >= prevIndexRef.current ? 1 : -1;
  prevIndexRef.current = index;

  const cooldownUntilRef = useRef(0);

  useEffect(() => {
    onDesktopChange?.(isDesktop);
  }, [isDesktop, onDesktopChange]);

  function goToOffset(offset: number) {
    const now = Date.now();
    if (now < cooldownUntilRef.current) return;
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= slides.length) return;
    cooldownUntilRef.current = now + COOLDOWN_MS;
    onActiveChange(slides[nextIndex].id);
  }

  useEffect(() => {
    if (!isDesktop) return;

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      if (Math.abs(e.deltaY) < WHEEL_THRESHOLD) return;
      goToOffset(e.deltaY > 0 ? 1 : -1);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (["ArrowDown", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        goToOffset(1);
      } else if (["ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        goToOffset(-1);
      }
    }

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop, index, slides.length]);

  if (!isDesktop) return <>{children}</>;

  return (
    <div className="fixed inset-0 h-dvh w-full overflow-hidden bg-[#fdf6ee]">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={slides[index]?.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={TRANSITION}
          // Plain block flow, not flex-centered — content decides its own layout/centering
          // (e.g. full-width, aspect-ratio-driven canvases need to stay block-level so their
          // own w-full resolves against the full slide width, not a shrink-to-fit flex child).
          className="absolute inset-0 h-dvh w-full overflow-y-auto"
        >
          {slides[index]?.node}
        </motion.div>
      </AnimatePresence>

      <div className="fixed top-1/2 right-4 z-30 flex -translate-y-1/2 flex-col gap-2.5 xl:right-6">
        {slides.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-label={`Go to ${s.id} section`}
            onClick={() => {
              if (Date.now() >= cooldownUntilRef.current) {
                cooldownUntilRef.current = Date.now() + COOLDOWN_MS;
                onActiveChange(s.id);
              }
            }}
            className={`size-2 rounded-full transition-all ${
              s.id === activeId ? "h-5 bg-[#3a2e2a]" : "bg-[#3a2e2a]/25 hover:bg-[#3a2e2a]/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Backpack,
  Check,
  ClipboardList,
  Coffee,
  Footprints,
  GraduationCap,
  Headphones,
  Laptop,
  Luggage,
  NotebookText,
} from "lucide-react";

import { BrandName } from "@/components/shared/brand-name";
import { writeSelectedGender } from "@/lib/onboarding-gender";
import { cn } from "@/lib/utils";
import type { Gender } from "@/types";

const GENDER_CARDS = [
  {
    gender: "Female" as Gender,
    label: "College Girl",
    avatar: "\u{1F469}‍\u{1F393}",
    bg: "from-[#F3E8FF] to-[#EDE0FB]",
    border: "border-[#C9A6EE]",
    ring: "bg-[#EDE0FB]",
  },
  {
    gender: "Male" as Gender,
    label: "College Boy",
    avatar: "\u{1F468}‍\u{1F393}",
    bg: "from-[#E3EEFF] to-[#DCE8FF]",
    border: "border-[#A8C4F0]",
    ring: "bg-[#DCE8FF]",
  },
] as const;

const FEATURE_TAGS = ["Packing Lists", "Budgeting", "Shopping", "Roommates"];

// Faint outline doodles scattered behind the card, echoing what's actually in a move-in bag.
const BACKGROUND_DOODLES = [
  { Icon: Backpack, className: "top-4 -left-6 size-16 -rotate-12", delay: 0 },
  { Icon: NotebookText, className: "-top-2 right-2 size-12 rotate-6", delay: 0.2 },
  { Icon: Coffee, className: "top-1/3 -left-10 size-10 -rotate-6", delay: 0.4 },
  { Icon: Luggage, className: "top-1/4 -right-10 size-16 rotate-6", delay: 0.1 },
  { Icon: Headphones, className: "bottom-1/4 -left-8 size-12 rotate-12", delay: 0.3 },
  { Icon: Footprints, className: "bottom-6 right-4 size-10 -rotate-6", delay: 0.5 },
  { Icon: Laptop, className: "-bottom-4 right-1/4 size-14 rotate-3", delay: 0.15 },
] as const;

// Brief pause so the tap's highlight is visible before the route change carries it away.
const NAVIGATE_DELAY_MS = 350;

export function LandingView() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Gender | null>(null);

  function handleSelect(gender: Gender) {
    if (selected) return;
    setSelected(gender);
    writeSelectedGender(gender);
    setTimeout(() => navigate("/wa-login"), NAVIGATE_DELAY_MS);
  }

  return (
    <div className="relative w-full max-w-md">
      {BACKGROUND_DOODLES.map(({ Icon, className, delay }, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay, duration: 0.6 }}
          className={cn("pointer-events-none absolute text-foreground/[0.07]", className)}
        >
          <Icon className="size-full" strokeWidth={1.25} />
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass relative w-full overflow-visible rounded-[2rem] p-8 text-center shadow-[0_25px_60px_-20px_var(--shadow-brand)]"
      >
        {/* Top visual: a "packing checklist" badge with a completion check */}
        <div className="relative mx-auto mb-5 flex h-24 w-24 items-center justify-center">
          <div className="gradient-brand flex h-24 w-24 items-center justify-center rounded-[1.75rem] shadow-lg">
            <ClipboardList className="size-11 text-white drop-shadow-sm" strokeWidth={2.2} />
          </div>
          <div className="border-background bg-primary absolute -right-2 -bottom-2 flex size-9 items-center justify-center rounded-full border-4">
            <Check className="text-primary-foreground size-4" strokeWidth={3} />
          </div>
        </div>

        <h1 className="flex flex-wrap items-center justify-center gap-1.5">
          <BrandName className="text-4xl sm:text-5xl" />
        </h1>

        <p className="text-muted-foreground mx-auto mt-3 max-w-[24rem] text-sm leading-relaxed">
          College packing, simplified. Lists. Bags.{" "}
          <span className="marker-highlight font-semibold whitespace-nowrap text-[#3a2e2a]">Done right.</span>
        </p>
        <p className="text-muted-foreground/80 mt-1.5 flex items-center justify-center gap-1 text-xs font-medium">
          <GraduationCap className="size-3.5" strokeWidth={2} />
          Built by IIT Bombay alumni
        </p>

        <div className="text-muted-foreground mt-6 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-[11px] font-medium sm:text-xs">
          {FEATURE_TAGS.map((tag, i) => (
            <span key={tag} className="flex items-center gap-1.5 whitespace-nowrap">
              {tag}
              {i < FEATURE_TAGS.length - 1 && <span className="text-primary">&bull;</span>}
            </span>
          ))}
        </div>
        <div className="border-accent/60 mx-auto mt-2 w-40 border-b-2" />

        <p className="font-cursive text-primary mt-5 text-xl">Plan smart. Move easy. Start fresh.</p>

        <p className="text-muted-foreground mt-7 mb-4 text-xs font-medium">Let's make this yours &#10024;</p>

        <div className="flex gap-4">
          {GENDER_CARDS.map(({ gender, label, avatar, bg, border, ring }) => {
            const isSelected = selected === gender;
            return (
              <motion.button
                key={gender}
                type="button"
                onClick={() => handleSelect(gender)}
                disabled={selected !== null}
                whileTap={selected === null ? { scale: 0.94 } : undefined}
                animate={isSelected ? { scale: 1.05 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className={cn(
                  "flex flex-1 flex-col items-center gap-3 rounded-[1.5rem] border-2 bg-gradient-to-b px-4 py-6 shadow-md transition-[opacity,box-shadow] duration-200",
                  bg,
                  isSelected ? cn(border, "shadow-xl") : "border-white/80 hover:shadow-lg",
                  selected !== null && !isSelected && "opacity-40",
                )}
              >
                <div className={cn("flex size-16 items-center justify-center rounded-full shadow-inner", ring)}>
                  <span className="text-3xl">{avatar}</span>
                </div>
                <span className="font-display text-sm font-bold text-[#3a2e2a]">{label}</span>
                <span className="text-primary flex items-center gap-1 text-xs font-semibold">
                  Start Packing
                  <ArrowRight className="size-3.5" strokeWidth={2.5} />
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

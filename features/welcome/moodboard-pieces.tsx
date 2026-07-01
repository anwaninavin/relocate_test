"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export const NOTE_COLORS = {
  yellow: "bg-[#fff3b0]",
  pink: "bg-[#ffd6e8]",
  blue: "bg-[#cfeaff]",
  lavender: "bg-[#e3d9ff]",
} as const;

export type NoteColor = keyof typeof NOTE_COLORS;

interface TiltProps {
  rotate?: number;
  delay?: number;
  className?: string;
  children: React.ReactNode;
}

/** Generic scroll-triggered "pasted onto the board" entrance. */
export function Pasted({ rotate = 0, delay = 0, className, children }: TiltProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: rotate * 2.2, scale: 0.92 }}
      whileInView={{ opacity: 1, y: 0, rotate, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: [0.34, 1.56, 0.64, 1] }}
      whileHover={{ rotate: 0, scale: 1.04, zIndex: 20 }}
      className={cn("relative", className)}
      style={{ rotate: `${rotate}deg` }}
    >
      {children}
    </motion.div>
  );
}

export function Tape({ rotate = -5, className }: { rotate?: number; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("tape absolute -top-4 left-1/2 -z-0", className)}
      style={{ ["--tape-rotate" as string]: `${rotate}deg` }}
    />
  );
}

export function StickyNote({
  color = "yellow",
  rotate = -3,
  delay = 0,
  tape = true,
  className,
  children,
}: {
  color?: NoteColor;
  rotate?: number;
  delay?: number;
  tape?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Pasted
      rotate={rotate}
      delay={delay}
      className={cn(
        "w-full max-w-[240px] p-5 text-[#3a2e2a] shadow-[3px_5px_14px_rgba(58,46,42,0.15)]",
        NOTE_COLORS[color],
        tape && "tape",
        className,
      )}
    >
      {children}
    </Pasted>
  );
}

export function Polaroid({
  rotate = -2,
  delay = 0,
  caption,
  emoji,
  className,
}: {
  rotate?: number;
  delay?: number;
  caption: string;
  emoji: string;
  className?: string;
}) {
  return (
    <Pasted
      rotate={rotate}
      delay={delay}
      className={cn(
        "w-full max-w-[200px] border border-black/5 bg-white p-3 pb-5 shadow-[4px_6px_16px_rgba(58,46,42,0.18)]",
        className,
      )}
    >
      <div className="flex aspect-square items-center justify-center rounded-sm bg-gradient-to-br from-[#fdf6ee] to-[#f3e6d5] text-6xl">
        {emoji}
      </div>
      <p className="mt-3 text-center text-xl text-[#3a2e2a] font-[family-name:var(--font-caveat-mood)]">
        {caption}
      </p>
    </Pasted>
  );
}

export function Sticker({
  children,
  className,
  bobDelay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  bobDelay?: number;
}) {
  return (
    <span
      aria-hidden
      className={cn("animate-bob pointer-events-none absolute select-none", className)}
      style={{ animationDelay: `${bobDelay}s` }}
    >
      {children}
    </span>
  );
}

export function ScribbleArrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 60"
      className={cn("pointer-events-none absolute h-10 w-16 text-[#3a2e2a]", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
    >
      <path d="M4 10c20 0 55-6 74 8-10 1-18 5-24 11m24-11c-6 4-10 12-11 20" />
    </svg>
  );
}

export function ScribbleCircle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 60"
      className={cn("pointer-events-none absolute text-[#e0568c]", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={4}
      strokeLinecap="round"
    >
      <path d="M60 8C30 6 8 20 10 34c2 16 30 24 54 22 26-2 46-14 44-26C106 16 78 8 56 10" />
    </svg>
  );
}

export function Highlight({
  color = "#fef08a",
  className,
  children,
}: {
  color?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn("marker-highlight font-semibold", className)}
      style={{ ["--highlight-color" as string]: color }}
    >
      {children}
    </span>
  );
}

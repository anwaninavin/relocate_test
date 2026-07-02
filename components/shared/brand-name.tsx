import { Alex_Brush } from "next/font/google";

import { cn } from "@/lib/utils";

const cursive = Alex_Brush({ subsets: ["latin"], weight: "400" });

export function BrandName({ className }: { className?: string }) {
  return (
    <span className={cn("font-display font-extrabold", className)}>
      Pack{" "}
      <span className={cn(cursive.className, "text-primary italic font-normal")}>with</span>{" "}
      Me
    </span>
  );
}

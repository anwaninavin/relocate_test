"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { KeyRound, Loader2, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HOME_ROUTE } from "@/lib/nav-items";

export function PinLoginForm() {
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await signIn("mobile-pin", { mobile, pin, redirect: false });

      if (result?.error) {
        setError("Invalid mobile number or code, or too many attempts. Please try again in a few minutes.");
        return;
      }

      router.push(HOME_ROUTE);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
    >
      <div className="grid gap-2">
        <Label htmlFor="pin-mobile">Mobile number</Label>
        <div className="relative">
          <Phone className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
          <Input
            id="pin-mobile"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="98765 43210"
            className="pl-11"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="pin-code">Login code</Label>
        <div className="relative">
          <KeyRound className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
          <Input
            id="pin-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="7-digit code"
            className="pl-11 tracking-widest"
            maxLength={7}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            required
          />
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
      </div>
      <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
        Log in with code
      </Button>
    </motion.form>
  );
}

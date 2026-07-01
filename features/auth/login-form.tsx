"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { MessageCircle, Phone, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "mobile" | "waiting" | "verified";

interface TicketState {
  token: string;
  deepLink: string;
  expiresAt: string;
}

const POLL_INTERVAL_MS = 2000;

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [ticket, setTicket] = useState<TicketState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function handleMobileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      setTicket(data);
      setStep("waiting");
      startPolling(data.token);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function startPolling(token: string) {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/login-ticket/${token}/status`);
        const data = await res.json();

        if (data.status === "verified") {
          if (pollRef.current) clearInterval(pollRef.current);
          setStep("verified");

          const signInResult = await signIn("whatsapp-ticket", {
            token,
            redirect: false,
          });

          if (signInResult?.error) {
            toast.error("Could not complete sign-in. Please try again.");
            setStep("waiting");
            return;
          }

          router.push("/dashboard");
          router.refresh();
        } else if (data.status === "expired" || data.status === "not_found") {
          if (pollRef.current) clearInterval(pollRef.current);
          setError("This login link expired. Please try again.");
          setStep("mobile");
        }
      } catch {
        // transient network hiccup — keep polling
      }
    }, POLL_INTERVAL_MS);
  }

  function handleBack() {
    if (pollRef.current) clearInterval(pollRef.current);
    setStep("mobile");
    setTicket(null);
    setError(null);
  }

  return (
    <div className="glass relative w-full max-w-md overflow-hidden rounded-3xl p-8 shadow-2xl">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="gradient-brand flex size-14 items-center justify-center rounded-2xl shadow-lg shadow-primary/25">
          <MessageCircle className="size-7 text-white" />
        </div>
        <h1 className="font-display text-2xl font-bold">Hostel Essentials</h1>
        <p className="text-muted-foreground text-sm">
          No passwords. Log in instantly with WhatsApp.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === "mobile" && (
          <motion.form
            key="mobile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleMobileSubmit}
            className="flex flex-col gap-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="mobile">Mobile number</Label>
              <div className="relative">
                <Phone className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
                <Input
                  id="mobile"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="98765 43210"
                  className="pl-11"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
            </div>
            <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2">
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Continue with WhatsApp
            </Button>
          </motion.form>
        )}

        {step === "waiting" && ticket && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col items-center gap-5"
          >
            <div className="rounded-2xl bg-white p-3 shadow-md">
              <QRCodeSVG value={ticket.deepLink} size={168} />
            </div>
            <p className="text-muted-foreground text-center text-sm">
              Scan with your phone camera, or tap below on mobile
            </p>
            <Button asChild size="lg" className="w-full">
              <a href={ticket.deepLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" />
                Open WhatsApp to Continue
              </a>
            </Button>
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Waiting for confirmation on WhatsApp…
            </div>
            <button
              type="button"
              onClick={handleBack}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Use a different number
            </button>
          </motion.div>
        )}

        {step === "verified" && (
          <motion.div
            key="verified"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 py-6"
          >
            <CheckCircle2 className="text-success size-14" />
            <p className="font-medium">Verified! Taking you in…</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

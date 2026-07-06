import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandName } from "@/components/shared/brand-name";
import { ApiError } from "@/lib/api";

interface OtpRequestResult {
  sent: boolean;
  error?: string | null;
  devOtp?: string;
}

interface OtpAuthFormProps {
  heading: string;
  subheading: string;
  submitLabel: string;
  requestOtp: (mobile: string) => Promise<OtpRequestResult>;
  submit: (mobile: string, code: string) => Promise<void>;
  footer: { prompt: string; linkLabel: string; linkTo: string };
}

export function OtpAuthForm({
  heading,
  subheading,
  submitLabel,
  requestOtp,
  submit,
  footer,
}: OtpAuthFormProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<0 | 1>(0);
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [sendStatus, setSendStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await requestOtp(mobile);
      if (result.devOtp) {
        toast.info(`Dev OTP: ${result.devOtp}`, { description: "WhatsApp send not confirmed" });
        setSendStatus({ ok: true, message: `Dev mode — your code is ${result.devOtp}` });
      } else if (result.sent) {
        setSendStatus({ ok: true, message: `We've sent a 6-digit code to ${mobile} on WhatsApp.` });
      } else {
        setSendStatus({
          ok: false,
          message: result.error ?? "Couldn't confirm the WhatsApp send — check your WhatsApp and try again if needed.",
        });
      }
      setStep(1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await submit(mobile, code);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="glass relative w-full max-w-md overflow-hidden rounded-3xl p-8 shadow-2xl">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <img src="/logo.png" alt="" width={64} height={64} />
        <h1 className="text-2xl">
          <BrandName />
        </h1>
        <p className="text-muted-foreground text-sm">{step === 0 ? subheading : `Enter the code sent to ${mobile}`}</p>
      </div>

      {step === 0 ? (
        <motion.form
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onSubmit={handleRequestOtp}
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
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
            {heading}
          </Button>
        </motion.form>
      ) : (
        <motion.form
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          {sendStatus && (
            <div
              className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${
                sendStatus.ok
                  ? "border-primary/20 bg-primary/5 text-foreground"
                  : "border-destructive/20 bg-destructive/5 text-destructive"
              }`}
            >
              {sendStatus.ok && <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
              <span>{sendStatus.message}</span>
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="otp-code">WhatsApp code</Label>
            <Input
              id="otp-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6-digit code"
              className="tracking-widest"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              required
              autoFocus
            />
            <p className="text-muted-foreground text-xs">This code is also your login code — keep it safe, you'll use it to log in next time.</p>
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
          <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2">
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {submitLabel}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setStep(0)}>
            Back
          </Button>
        </motion.form>
      )}

      <p className="text-muted-foreground mt-6 text-center text-sm">
        {footer.prompt}{" "}
        <Link to={footer.linkTo} className="text-foreground font-medium underline underline-offset-4">
          {footer.linkLabel}
        </Link>
      </p>
    </div>
  );
}

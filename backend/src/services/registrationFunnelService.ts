import { connectDB } from "@/db";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import type { DateRange } from "@/lib/dateRange";

/**
 * The funnel as actually implemented by this app's real registration flow (not the generic
 * textbook funnel) — self-registration is: land on the app, open the register/login screen,
 * start typing (which requires a mobile number to proceed), request a WhatsApp OTP, verify
 * it, and the account is created in that same request (there's no separate "form completed"
 * step server-side — OTP verification and account creation happen together in
 * `POST /register/verify`). Each stage below maps to one real event name.
 */
const FUNNEL_STEPS: { key: string; label: string; eventName: string }[] = [
  { key: "landing", label: "Landing page", eventName: "session_start" },
  { key: "register_opened", label: "Register page opened", eventName: "registration_page_opened" },
  { key: "started_filling", label: "Started filling form", eventName: "form_interaction" },
  { key: "otp_requested", label: "Mobile entered / OTP sent", eventName: "otp_requested" },
  { key: "otp_verified", label: "OTP verified", eventName: "otp_verified" },
  { key: "registered", label: "Registered successfully", eventName: "registration_success" },
];

interface FirstTimestampRow {
  _id: string;
  firstAt: Date;
}

async function firstTimestampByVisitor(eventName: string, range: DateRange, extraMatch: Record<string, unknown> = {}) {
  const rows = await AnalyticsEvent.aggregate<FirstTimestampRow>([
    { $match: { eventName, timestamp: { $gte: range.start, $lte: range.end }, ...extraMatch } },
    { $group: { _id: "$visitorId", firstAt: { $min: "$timestamp" } } },
  ]);
  return new Map(rows.map((r) => [r._id, r.firstAt]));
}

export async function getRegistrationFunnel(range: DateRange) {
  await connectDB();

  const stepMatches: Record<string, Record<string, unknown>> = {
    started_filling: { "metadata.formId": "register-form" },
    otp_requested: { "metadata.purpose": "register" },
    otp_verified: { "metadata.purpose": "register" },
  };

  const stepMaps = await Promise.all(
    FUNNEL_STEPS.map((step) => firstTimestampByVisitor(step.eventName, range, stepMatches[step.key] ?? {})),
  );

  const steps = FUNNEL_STEPS.map((step, i) => {
    const count = stepMaps[i].size;
    const prevCount = i === 0 ? count : stepMaps[i - 1].size;
    const firstCount = stepMaps[0].size || 1;

    let totalSeconds = 0;
    let pairCount = 0;
    if (i > 0) {
      for (const [visitorId, currentAt] of stepMaps[i]) {
        const prevAt = stepMaps[i - 1].get(visitorId);
        if (!prevAt) continue;
        const delta = (currentAt.getTime() - prevAt.getTime()) / 1000;
        if (delta >= 0 && delta < 24 * 60 * 60) {
          totalSeconds += delta;
          pairCount += 1;
        }
      }
    }

    return {
      key: step.key,
      label: step.label,
      users: count,
      conversionFromStart: Math.round((count / firstCount) * 1000) / 10,
      dropOffFromPrevious: i === 0 || prevCount === 0 ? 0 : Math.round((1 - count / prevCount) * 1000) / 10,
      avgTimeFromPreviousSeconds: pairCount === 0 ? null : Math.round(totalSeconds / pairCount),
    };
  });

  // Segments the spec explicitly asks to "detect" — reported as counts, not identities,
  // since pre-registration visitors have no durable identifier beyond the anonymous
  // visitorId and surfacing raw mobile numbers here would defeat the GDPR-ready design.
  const openedButLeft = [...stepMaps[1].keys()].filter((v) => !stepMaps[2].has(v)).length;
  const enteredMobileButClosed = [...stepMaps[3].keys()].filter((v) => !stepMaps[4].has(v)).length;

  const otpFailedCount = await AnalyticsEvent.countDocuments({
    eventName: "otp_failed",
    "metadata.purpose": "register",
    timestamp: { $gte: range.start, $lte: range.end },
  });

  const OTP_TIMEOUT_MS = 10 * 60 * 1000; // matches otpService.OTP_TTL_MS
  let otpTimeoutCount = 0;
  const otpFailedVisitors = new Set(
    await AnalyticsEvent.distinct("visitorId", {
      eventName: "otp_failed",
      "metadata.purpose": "register",
      timestamp: { $gte: range.start, $lte: range.end },
    }),
  );
  for (const [visitorId, requestedAt] of stepMaps[3]) {
    if (stepMaps[4].has(visitorId) || otpFailedVisitors.has(visitorId)) continue;
    if (Date.now() - requestedAt.getTime() > OTP_TIMEOUT_MS) otpTimeoutCount += 1;
  }

  const registrationAbandoned = stepMaps[1].size - stepMaps[5].size;

  return {
    steps,
    detected: {
      openedRegistrationButLeft: openedButLeft,
      enteredMobileButClosed,
      otpFailed: otpFailedCount,
      otpTimeout: otpTimeoutCount,
      registrationAbandoned: Math.max(0, registrationAbandoned),
      registrationSuccess: stepMaps[5].size,
    },
  };
}

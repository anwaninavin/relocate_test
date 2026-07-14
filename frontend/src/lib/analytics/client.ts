/**
 * Self-hosted analytics client — no third-party script, no external network calls beyond
 * this app's own backend. Generates a persistent anonymous visitor id and a rolling session
 * id, auto-captures page views/clicks/forms/scroll depth, and batches everything to
 * POST /api/analytics/collect so a burst of interaction never means a burst of requests.
 */

const VISITOR_ID_KEY = "pwm_visitor_id";
const SESSION_KEY = "pwm_session";
const SESSION_TTL_MS = 30 * 60 * 1000;
const FLUSH_INTERVAL_MS = 5000;
const MAX_BATCH_SIZE = 20;

export type ClientEventName =
  | "page_view"
  | "click"
  | "button_click"
  | "form_interaction"
  | "scroll_checkpoint"
  | "session_start"
  | "registration_page_opened";

interface QueuedEvent {
  eventName: ClientEventName;
  visitorId: string;
  sessionId: string;
  page: string | null;
  referrer: string | null;
  utm?: Record<string, string | null>;
  device?: { type: "mobile" | "desktop" | "tablet"; screenWidth: number; screenHeight: number };
  language: string | null;
  timezone: string | null;
  metadata?: Record<string, unknown> | null;
  timestamp: number;
}

interface SessionState {
  id: string;
  lastActivity: number;
  utm: Record<string, string | null>;
  entryReferrer: string | null;
}

function readUtmFromLocation(): Record<string, string | null> {
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get("utm_source"),
    medium: params.get("utm_medium"),
    campaign: params.get("utm_campaign"),
    term: params.get("utm_term"),
    content: params.get("utm_content"),
  };
}

function generateId(): string {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_ID_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(VISITOR_ID_KEY, id);
  }
  return id;
}

let sessionState: SessionState | null = null;
let sessionIsNew = false;

function loadSession(): SessionState {
  const raw = localStorage.getItem(SESSION_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as SessionState;
      if (Date.now() - parsed.lastActivity < SESSION_TTL_MS) {
        return parsed;
      }
    } catch {
      // fall through to a fresh session
    }
  }
  sessionIsNew = true;
  return {
    id: generateId(),
    lastActivity: Date.now(),
    utm: readUtmFromLocation(),
    entryReferrer: document.referrer || null,
  };
}

function getSession(): SessionState {
  if (!sessionState) sessionState = loadSession();

  if (Date.now() - sessionState.lastActivity >= SESSION_TTL_MS) {
    sessionIsNew = true;
    sessionState = {
      id: generateId(),
      lastActivity: Date.now(),
      utm: readUtmFromLocation(),
      entryReferrer: document.referrer || null,
    };
  }

  sessionState.lastActivity = Date.now();
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionState));
  return sessionState;
}

export function getVisitorAndSessionIds(): { visitorId: string; sessionId: string } {
  return { visitorId: getVisitorId(), sessionId: getSession().id };
}

function detectDeviceType(): "mobile" | "desktop" | "tablet" {
  const width = window.innerWidth;
  const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  if (width < 768) return "mobile";
  if (width < 1180 && coarsePointer) return "tablet";
  return "desktop";
}

const queue: QueuedEvent[] = [];

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

function flush(useBeacon = false) {
  if (queue.length === 0) return;
  const events = queue.splice(0, queue.length);
  const body = JSON.stringify({ events });

  if (useBeacon && navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(`${API_URL}/api/analytics/collect`, blob);
    return;
  }

  const token = localStorage.getItem("pwm_auth_token");
  fetch(`${API_URL}/api/analytics/collect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
    keepalive: true,
  }).catch(() => {
    // Analytics delivery is best-effort — never surface a failure to the user.
  });
}

let flushTimer: ReturnType<typeof setInterval> | null = null;
function ensureFlushTimer() {
  if (flushTimer) return;
  flushTimer = setInterval(() => flush(), FLUSH_INTERVAL_MS);
  window.addEventListener("pagehide", () => flush(true));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush(true);
  });
}

export function trackEvent(eventName: ClientEventName, metadata?: Record<string, unknown> | null, pageOverride?: string) {
  ensureFlushTimer();
  const { visitorId } = getVisitorAndSessionIds();
  const session = getSession();

  if (sessionIsNew) {
    sessionIsNew = false;
    queue.push({
      eventName: "session_start",
      visitorId,
      sessionId: session.id,
      page: pageOverride ?? window.location.pathname,
      referrer: session.entryReferrer,
      utm: session.utm,
      device: { type: detectDeviceType(), screenWidth: window.screen.width, screenHeight: window.screen.height },
      language: navigator.language ?? null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null,
      timestamp: Date.now(),
    });
  }

  queue.push({
    eventName,
    visitorId,
    sessionId: session.id,
    page: pageOverride ?? window.location.pathname,
    referrer: session.entryReferrer,
    utm: session.utm,
    device: { type: detectDeviceType(), screenWidth: window.screen.width, screenHeight: window.screen.height },
    language: navigator.language ?? null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null,
    metadata: metadata ?? null,
    timestamp: Date.now(),
  });

  if (queue.length >= MAX_BATCH_SIZE) flush();
}

let firstLoadReported = false;

export function trackPageView(page: string) {
  let loadMs: number | null = null;
  if (!firstLoadReported) {
    firstLoadReported = true;
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (nav) loadMs = Math.round(nav.loadEventEnd - nav.startTime);
  }
  trackEvent("page_view", loadMs ? { loadMs } : null, page);
  scrollTracker.reset();
}

export function trackButtonClick(label: string, tag: string) {
  trackEvent("button_click", { label, tag });
}

export function trackDeadClick(tag: string, xPercent: number, yPercent: number) {
  trackEvent("click", { dead: true, tag, x: Math.round(xPercent), y: Math.round(yPercent) });
}

export function trackFormInteraction(formId: string, action: "start" | "submit", field?: string) {
  trackEvent("form_interaction", { formId, action, field });
}

export function trackRegistrationPageOpened() {
  trackEvent("registration_page_opened");
}

const scrollTracker = (() => {
  const thresholds = [25, 50, 75, 100];
  let firedThresholds = new Set<number>();

  function reset() {
    firedThresholds = new Set();
  }

  function onScroll() {
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollableHeight <= 0) return;
    const percent = Math.min(100, Math.round(((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100));
    for (const threshold of thresholds) {
      if (percent >= threshold && !firedThresholds.has(threshold)) {
        firedThresholds.add(threshold);
        trackEvent("scroll_checkpoint", { percent: threshold });
      }
    }
  }

  return { reset, onScroll };
})();

const INTERACTIVE_SELECTOR = 'button, a, [role="button"], input, select, textarea, label, [data-track]';

function labelFor(el: Element): string {
  const aria = el.getAttribute("aria-label");
  if (aria) return aria;
  const text = el.textContent?.trim().slice(0, 60);
  if (text) return text;
  return el.getAttribute("id") || el.tagName.toLowerCase();
}

function handleDelegatedClick(e: MouseEvent) {
  const target = e.target as Element | null;
  if (!target) return;

  const interactive = target.closest(INTERACTIVE_SELECTOR);
  if (interactive) {
    if (interactive.tagName === "BUTTON" || interactive.tagName === "A" || interactive.getAttribute("role") === "button") {
      trackButtonClick(labelFor(interactive), interactive.tagName.toLowerCase());
    }
    return;
  }

  // No interactive ancestor found within the click path — a reasonable proxy for a "dead
  // click" (the user clicked expecting something to happen and nothing did).
  const xPercent = (e.clientX / window.innerWidth) * 100;
  const yPercent = (e.clientY / window.innerHeight) * 100;
  trackDeadClick(target.tagName.toLowerCase(), xPercent, yPercent);
}

const formsStarted = new Set<string>();

function formIdFor(form: HTMLFormElement): string {
  return form.id || form.getAttribute("data-form-id") || form.getAttribute("name") || "form";
}

function handleFocusIn(e: FocusEvent) {
  const target = e.target as Element | null;
  if (!target || !("closest" in target)) return;
  if (!["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) return;
  const form = target.closest("form");
  if (!form) return;
  const formId = formIdFor(form);
  if (formsStarted.has(formId)) return;
  formsStarted.add(formId);
  trackFormInteraction(formId, "start", target.getAttribute("name") || target.id || undefined);
}

function handleSubmit(e: SubmitEvent) {
  const form = e.target as HTMLFormElement;
  trackFormInteraction(formIdFor(form), "submit");
}

let initialized = false;

/** Wires up all delegated, app-wide listeners once. Safe to call multiple times. */
export function initAnalyticsClient() {
  if (initialized) return;
  initialized = true;
  ensureFlushTimer();

  document.addEventListener("click", handleDelegatedClick, { capture: false });
  document.addEventListener("focusin", handleFocusIn);
  document.addEventListener("submit", handleSubmit);
  window.addEventListener("scroll", () => scrollTracker.onScroll(), { passive: true });
}

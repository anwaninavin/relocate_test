import { UAParser } from "ua-parser-js";

export type DeviceType = "mobile" | "desktop" | "tablet";

export interface ParsedDevice {
  deviceType: DeviceType;
  browser: string | null;
  os: string | null;
}

/** Server-side fallback parse of the User-Agent header — used when a client can't or didn't
 * report richer `navigator`-derived device info in the event payload itself. */
export function parseUserAgent(uaString: string | undefined): ParsedDevice {
  if (!uaString) {
    return { deviceType: "desktop", browser: null, os: null };
  }

  const { browser, os, device } = new UAParser(uaString).getResult();

  const deviceType: DeviceType = device.type === "mobile" ? "mobile" : device.type === "tablet" ? "tablet" : "desktop";

  return {
    deviceType,
    browser: browser.name ?? null,
    os: os.name ?? null,
  };
}

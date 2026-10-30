declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** No-op if GA4 hasn't loaded (blocked by an ad blocker, etc.) — never throws. */
export function gtag(...args: unknown[]) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag(...args);
  }
}

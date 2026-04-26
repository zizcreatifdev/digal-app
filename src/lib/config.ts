// Central app URL — set VITE_APP_URL in .env for production
export const APP_URL =
  (import.meta.env.VITE_APP_URL as string | undefined) ||
  (typeof window !== "undefined" ? window.location.origin : "");

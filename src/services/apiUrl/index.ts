import { Capacitor } from "@capacitor/core";

function getApiOrigin() {
  if (!Capacitor.isNativePlatform()) return "";

  return (import.meta.env.VITE_API_ORIGIN || import.meta.env.VITE_SITE_URL || "").replace(/\/+$/, "");
}

export function getApiUrl(path: string) {
  return `${getApiOrigin()}${path}`;
}

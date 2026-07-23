import { Capacitor } from "@capacitor/core";

function getApiOrigin() {
  if (!Capacitor.isNativePlatform()) return "";

  const configuredOrigin = (import.meta.env.VITE_API_ORIGIN || import.meta.env.VITE_SITE_URL || "").trim();
  if (!configuredOrigin) return "";

  const originWithProtocol = /^https?:\/\//i.test(configuredOrigin)
    ? configuredOrigin
    : `https://${configuredOrigin}`;

  return originWithProtocol.replace(/\/+$/, "");
}

export function getApiUrl(path: string) {
  return `${getApiOrigin()}${path}`;
}

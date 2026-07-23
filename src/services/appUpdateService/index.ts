import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { APP_VERSION } from "../../consts/appVersion";

const GITHUB_RELEASE_API = "https://api.github.com/repos/GabrielGoris/horizon/releases/latest";

type GitHubRelease = {
  assets?: Array<{ browser_download_url?: string; name?: string }>;
  body?: string | null;
  draft?: boolean;
  prerelease?: boolean;
  tag_name?: string;
};

export type AvailableAppUpdate = {
  downloadUrl: string;
  notes: string;
  version: string;
};

function parseVersion(value: string) {
  const match = value.trim().replace(/^v/i, "").match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return null;

  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function isVersionNewer(candidate: string, current: string) {
  const candidateParts = parseVersion(candidate);
  const currentParts = parseVersion(current);

  if (!candidateParts || !currentParts) return false;

  for (let index = 0; index < candidateParts.length; index += 1) {
    if (candidateParts[index] !== currentParts[index]) {
      return candidateParts[index] > currentParts[index];
    }
  }

  return false;
}

function getValidDownloadUrl(value?: string) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "github.com" ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function getAvailableAppUpdate(): Promise<AvailableAppUpdate | null> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") return null;

  try {
    const response = await fetch(GITHUB_RELEASE_API, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) return null;

    const release = await response.json() as GitHubRelease;
    const version = release.tag_name?.replace(/^v/i, "");
    const asset = release.assets?.find((item) => item.name?.toLowerCase().endsWith(".apk"));
    const downloadUrl = getValidDownloadUrl(asset?.browser_download_url);

    if (!version || !downloadUrl || release.draft || release.prerelease || !isVersionNewer(version, APP_VERSION)) return null;

    return {
      downloadUrl,
      notes: release.body?.trim() ?? "",
      version,
    };
  } catch {
    return null;
  }
}

export async function downloadAppUpdate(downloadUrl: string) {
  await Browser.open({
    url: downloadUrl,
    toolbarColor: "#131315",
  });
}

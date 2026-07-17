import { createHash, randomBytes } from "node:crypto";

const STEAM_OPENID_ENDPOINT = "https://steamcommunity.com/openid/login";

export type SteamOwnedGame = {
  appid: number;
  img_icon_url?: string;
  name: string;
  playtime_forever?: number;
  rtime_last_played?: number;
};

export type SteamConnection = {
  avatar_url: string | null;
  connected_at: string;
  display_name: string | null;
  last_synced_at: string | null;
  profile_url: string | null;
  steam_id: string;
};

type SteamPlayerSummary = {
  avatarfull?: string;
  personaname?: string;
  profileurl?: string;
  steamid: string;
};

export type SteamStoreGameDetails = {
  about_the_game?: string;
  capsule_image?: string;
  capsule_imagev5?: string;
  detailed_description?: string;
  developers?: string[];
  genres?: Array<{ description?: string }>;
  header_image?: string;
  name?: string;
  publishers?: string[];
  release_date?: { date?: string };
  short_description?: string;
  steam_appid?: number;
};

export function getSteamApiKey() {
  return process.env.STEAM_API_KEY ?? process.env.VITE_STEAM_API_KEY ?? "";
}

export function createOauthState() {
  const value = randomBytes(32).toString("base64url");

  return { hash: hashOauthState(value), value };
}

export function hashOauthState(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function getSteamAuthorizationUrl(callbackUrl: string, realm: string) {
  const url = new URL(STEAM_OPENID_ENDPOINT);

  url.searchParams.set("openid.ns", "http://specs.openid.net/auth/2.0");
  url.searchParams.set("openid.mode", "checkid_setup");
  url.searchParams.set("openid.return_to", callbackUrl);
  url.searchParams.set("openid.realm", realm);
  url.searchParams.set("openid.identity", "http://specs.openid.net/auth/2.0/identifier_select");
  url.searchParams.set("openid.claimed_id", "http://specs.openid.net/auth/2.0/identifier_select");

  return url.toString();
}

export async function verifySteamCallback(url: URL) {
  if (url.searchParams.get("openid.mode") !== "id_res") return null;

  const claimedId = url.searchParams.get("openid.claimed_id") ?? "";
  const steamId = claimedId.match(/^https?:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/)?.[1];

  if (!steamId) return null;

  const verificationParams = new URLSearchParams();

  url.searchParams.forEach((value, key) => {
    if (key.startsWith("openid.")) verificationParams.set(key, value);
  });
  verificationParams.set("openid.mode", "check_authentication");

  const response = await fetch(STEAM_OPENID_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: verificationParams,
  });
  const verification = await response.text();

  return response.ok && /(^|\n)is_valid:true(\n|$)/.test(verification) ? steamId : null;
}

export async function getSteamPlayerSummary(steamId: string, apiKey: string) {
  const url = new URL("https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/");

  url.searchParams.set("key", apiKey);
  url.searchParams.set("steamids", steamId);

  const response = await fetch(url, { headers: { Accept: "application/json" } });

  if (!response.ok) return null;

  const data = await response.json() as { response?: { players?: SteamPlayerSummary[] } };

  return data.response?.players?.[0] ?? null;
}

export async function getSteamOwnedGames(steamId: string, apiKey: string) {
  const url = new URL("https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/");

  url.searchParams.set("key", apiKey);
  url.searchParams.set("steamid", steamId);
  url.searchParams.set("format", "json");
  url.searchParams.set("include_appinfo", "true");
  url.searchParams.set("include_played_free_games", "true");

  const response = await fetch(url, { headers: { Accept: "application/json" } });

  if (!response.ok) {
    throw new Error(`Steam respondeu com status ${response.status}.`);
  }

  const data = await response.json() as {
    response?: { game_count?: number; games?: SteamOwnedGame[] };
  };

  if (typeof data.response?.game_count !== "number") {
    throw new Error("A biblioteca Steam não está pública.");
  }

  return data.response?.games ?? [];
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function getSteamStoreGameDetails(appId: number) {
  const url = new URL("https://store.steampowered.com/api/appdetails");

  url.searchParams.set("appids", String(appId));
  url.searchParams.set("l", "brazilian");
  url.searchParams.set("cc", "BR");

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
    });

    if (response.ok) {
      const data = await response.json() as Record<string, {
        data?: SteamStoreGameDetails;
        success?: boolean;
      }>;
      const result = data[String(appId)];

      return result?.success ? result.data ?? null : null;
    }

    if (response.status !== 429 && response.status < 500) return null;
    if (attempt < 2) await wait(300 * (attempt + 1));
  }

  return null;
}

export function stripSteamHtml(value?: string) {
  if (!value) return "";

  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function getSteamLibraryCover(appId: number) {
  return `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appId}/library_600x900.jpg`;
}

export function getSteamLibraryBackdrop(appId: number) {
  return `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appId}/library_hero.jpg`;
}

export function normalizeTitle(title: string) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

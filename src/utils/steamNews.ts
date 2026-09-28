import type { SteamDiscoveredGame } from "../services/steamIntegrationService/types/index.ts";

export interface SteamNews {
  knownAppIds: number[];
  pending: SteamDiscoveredGame[];
}

export function mergeSteamGames(previous: SteamDiscoveredGame[], incoming: SteamDiscoveredGame[]) {
  return [...new Map([...previous, ...incoming].map((game) => [game.appId, game])).values()];
}

export function reconcileSteamNews(previous: SteamNews | null, library: SteamDiscoveredGame[]): SteamNews {
  const known = new Set(previous?.knownAppIds ?? library.map((game) => game.appId));
  const active = new Set(library.map((game) => game.appId));
  return {
    knownAppIds: [...new Set([...known, ...active])],
    pending: mergeSteamGames(
      (previous?.pending ?? []).filter((game) => active.has(game.appId)),
      library.filter((game) => !known.has(game.appId)),
    ),
  };
}

export function readSteamNews(userId: string): SteamNews | null {
  try {
    const value = JSON.parse(localStorage.getItem(`horizon:steam-news:${userId}`) ?? "null");
    if (!value || !Array.isArray(value.knownAppIds) || !Array.isArray(value.pending)) return null;
    if (!value.knownAppIds.every(Number.isSafeInteger) || !value.pending.every((game: SteamDiscoveredGame) => game && Number.isSafeInteger(game.appId) && typeof game.title === "string" && typeof game.cover === "string" && typeof game.playtimeHours === "number")) return null;
    return value;
  } catch { return null; }
}

export function saveSteamNews(userId: string, news: SteamNews) {
  try { localStorage.setItem(`horizon:steam-news:${userId}`, JSON.stringify(news)); }
  catch { /* Keep the in-memory inbox usable when storage is unavailable. */ }
}

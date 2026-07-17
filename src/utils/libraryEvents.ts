import type { SteamDiscoveredGame } from "../services/steamIntegrationService";

export const LIBRARY_UPDATED_EVENT = "horizon:library-updated";
export const STEAM_GAMES_ADDED_EVENT = "horizon:steam-games-added";

export function notifyLibraryUpdated() {
  window.dispatchEvent(new Event(LIBRARY_UPDATED_EVENT));
}

export function notifySteamGamesAdded(games: SteamDiscoveredGame[]) {
  if (!games.length) return;

  window.dispatchEvent(new CustomEvent<SteamDiscoveredGame[]>(STEAM_GAMES_ADDED_EVENT, {
    detail: games,
  }));
}

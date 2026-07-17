export type SteamGameInformation = {
  campaign_hours?: number | string | null;
  category?: string | null;
  creator?: string | null;
  description?: string | null;
  enrichment_checked_at?: string | null;
  external_id?: string | null;
  hidden_at?: string | null;
  id?: string | null;
  release_year?: string | null;
  title: string;
};

export type IncompleteSteamGame = {
  appId: number;
  mediaId: string;
  reason: string;
  title: string;
};

function hasValue(value: unknown) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

export function getMissingSteamDetails(game: SteamGameInformation) {
  return [
    !hasValue(game.creator) ? "estúdio" : "",
    !hasValue(game.category) ? "gêneros" : "",
    !hasValue(game.description) ? "descrição" : "",
    !hasValue(game.release_year) ? "ano de lançamento" : "",
    !hasValue(game.campaign_hours) ? "tempo de campanha" : "",
  ].filter(Boolean);
}

export function needsSteamEnrichment(game?: SteamGameInformation) {
  if (!game) return true;
  if (game.hidden_at) return false;
  if (game.enrichment_checked_at) return false;

  return !hasValue(game.creator)
    || !hasValue(game.category)
    || !hasValue(game.description)
    || !hasValue(game.release_year);
}

export function getIncompleteSteamGames(games: SteamGameInformation[]) {
  return games
    .map(getIncompleteSteamGame)
    .filter((game): game is IncompleteSteamGame => Boolean(game));
}

export function getIncompleteSteamGame(game: SteamGameInformation): IncompleteSteamGame | null {
  const missingDetails = getMissingSteamDetails(game);
  const appId = Number(game.external_id);

  if (!missingDetails.length || !Number.isInteger(appId) || appId <= 0) return null;

  return {
    appId,
    mediaId: game.id ?? "",
    title: game.title,
    reason: `Faltando: ${missingDetails.join(", ")}.`,
  };
}

type TwitchTokenResponse = {
  access_token: string;
  expires_in: number;
};

type IgdbExternalGame = {
  game?: number;
  uid?: string;
};

type IgdbTimeToBeat = {
  game_id?: number;
  hastily?: number;
  normally?: number;
};

type IgdbGame = {
  alternative_names?: Array<{ name?: string }>;
  cover?: { url?: string };
  first_release_date?: number;
  genres?: Array<{ name?: string }>;
  id?: number;
  involved_companies?: Array<{
    company?: { name?: string };
    developer?: boolean;
    publisher?: boolean;
  }>;
  name?: string;
  storyline?: string;
  summary?: string;
};

type IgdbMultiQueryResult = {
  name?: string;
  result?: unknown;
};

export type IgdbEnrichedGame = {
  backdrop: string;
  campaignHours: string;
  category: string;
  cover: string;
  creator: string;
  description: string;
  releaseYear: string;
  title: string;
};

let accessToken = "";
let accessTokenExpiresAt = 0;
let steamSourceId: number | null = null;

function getCredentials() {
  return {
    clientId: process.env.IGDB_CLIENT_ID ?? process.env.VITE_IGDB_CLIENT_ID ?? "",
    clientSecret: process.env.IGDB_CLIENT_SECRET ?? process.env.VITE_IGDB_CLIENT_SECRET ?? "",
  };
}

async function getAccessToken(clientId: string, clientSecret: string) {
  if (accessToken && Date.now() < accessTokenExpiresAt) return accessToken;

  const url = new URL("https://id.twitch.tv/oauth2/token");

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("client_secret", clientSecret);
  url.searchParams.set("grant_type", "client_credentials");

  const response = await fetch(url, { method: "POST", signal: AbortSignal.timeout(8_000) });

  if (!response.ok) throw new Error("Não foi possível autenticar no IGDB.");

  const data = await response.json() as TwitchTokenResponse;

  accessToken = data.access_token;
  accessTokenExpiresAt = Date.now() + Math.max(data.expires_in - 60, 60) * 1000;

  return accessToken;
}

async function requestIgdb<T>(endpoint: string, body: string) {
  const { clientId, clientSecret } = getCredentials();

  if (!clientId || !clientSecret) return null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const token = await getAccessToken(clientId, clientSecret);
    const response = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Client-ID": clientId,
        "Content-Type": "text/plain",
      },
      body,
      signal: AbortSignal.timeout(8_000),
    });

    if (response.ok) return response.json() as Promise<T>;

    if (response.status === 401) {
      accessToken = "";
      accessTokenExpiresAt = 0;
    } else if (response.status !== 429 && response.status < 500) {
      throw new Error(`IGDB respondeu com status ${response.status}.`);
    }

    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
  }

  throw new Error("IGDB não respondeu após novas tentativas.");
}

async function getSteamSourceId() {
  if (steamSourceId) return steamSourceId;

  const sources = await requestIgdb<Array<{ id?: number; name?: string }>>(
    "external_game_sources",
    "fields id, name; limit 100;",
  );
  const source = sources?.find((item) => item.name?.toLocaleLowerCase("en-US") === "steam");

  steamSourceId = source?.id ?? null;

  return steamSourceId;
}

function secondsToDuration(value?: number) {
  if (!value) return "";

  const totalMinutes = Math.round(value / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!hours) return `${minutes} min`;
  if (!minutes) return `${hours}h`;

  return `${hours}h ${minutes} min`;
}

function escapeSearch(value: string) {
  return value
    .replace(/[©®™]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTitle(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function findTitleMatch(games: IgdbGame[], title: string) {
  const expectedTitle = normalizeTitle(title);
  const tokens = expectedTitle.split(" ").filter(Boolean);

  return games
    .map((game) => {
      const names = [game.name, ...(game.alternative_names?.map((name) => name.name) ?? [])]
        .filter((name): name is string => Boolean(name))
        .map(normalizeTitle);
      const exact = names.some((name) => name === expectedTitle);
      const tokenMatches = tokens.filter((token) => names.some((name) => name.includes(token))).length;

      return { game, score: (exact ? 1_000 : 0) + tokenMatches * 100 };
    })
    .sort((first, second) => second.score - first.score)[0]?.game;
}

function normalizeCover(url?: string) {
  if (!url) return "";

  const normalizedUrl = url.startsWith("//") ? `https:${url}` : url;

  return normalizedUrl.replace("t_thumb", "t_cover_big");
}

function mapIgdbGame(game: IgdbGame, campaignHours = ""): IgdbEnrichedGame {
  const developers = game.involved_companies
    ?.filter((company) => company.developer)
    .map((company) => company.company?.name)
    .filter((company): company is string => Boolean(company))
    .slice(0, 2) ?? [];
  const publishers = game.involved_companies
    ?.filter((company) => company.publisher)
    .map((company) => company.company?.name)
    .filter((company): company is string => Boolean(company))
    .slice(0, 2) ?? [];
  const cover = normalizeCover(game.cover?.url);

  return {
    title: game.name ?? "",
    creator: (developers.length ? developers : publishers).join(", "),
    category: game.genres
      ?.map((genre) => genre.name)
      .filter((genre): genre is string => Boolean(genre))
      .slice(0, 3)
      .join(", ") ?? "",
    cover,
    backdrop: cover,
    releaseYear: game.first_release_date
      ? String(new Date(game.first_release_date * 1000).getFullYear())
      : "",
    description: game.summary ?? game.storyline ?? "",
    campaignHours,
  };
}

function getMultiQueryArray<T>(results: IgdbMultiQueryResult[], name: string) {
  const result = results.find((item) => item.name === name)?.result;

  return Array.isArray(result) ? result as T[] : [];
}

export async function getIgdbDetailsBySteamGames(games: Array<{ appId: number; title: string }>) {
  const result = new Map<number, IgdbEnrichedGame>();
  const sourceId = await getSteamSourceId();

  if (!sourceId || !games.length) return result;

  const appIdFilter = games.map((game) => `"${game.appId}"`).join(",");
  const externalGames = await requestIgdb<IgdbExternalGame[]>(
    "external_games",
    `fields uid, game; where external_game_source = ${sourceId} & uid = (${appIdFilter}); limit ${games.length};`,
  );
  const externalByAppId = new Map((externalGames ?? []).map((item) => [Number(item.uid), item]));
  const gameIds = [...new Set((externalGames ?? [])
    .map((item) => item.game)
    .filter((gameId): gameId is number => Boolean(gameId)))];
  const gameFields = "id, name, alternative_names.name, summary, storyline, cover.url, first_release_date, genres.name, involved_companies.developer, involved_companies.publisher, involved_companies.company.name";
  const queries = [
    ...(gameIds.length ? [
      `query games "external-details" { fields ${gameFields}; where id = (${gameIds.join(",")}); limit ${gameIds.length}; };`,
      `query game_time_to_beats "external-times" { fields game_id, hastily, normally; where game_id = (${gameIds.join(",")}); limit ${gameIds.length}; };`,
    ] : []),
  ];
  const multiQueryResults = queries.length
    ? await requestIgdb<IgdbMultiQueryResult[]>("multiquery", queries.join("\n")) ?? []
    : [];
  const externalDetails = getMultiQueryArray<IgdbGame>(multiQueryResults, "external-details");
  const externalTimes = getMultiQueryArray<IgdbTimeToBeat>(multiQueryResults, "external-times");
  const detailsByGameId = new Map(externalDetails.map((game) => [game.id, game]));
  const timesByGameId = new Map(externalTimes.map((time) => [time.game_id, time]));

  games.forEach((game) => {
    const externalGame = externalByAppId.get(game.appId);
    const externalDetails = detailsByGameId.get(externalGame?.game);

    if (externalDetails) {
      const time = timesByGameId.get(externalGame?.game);

      result.set(game.appId, mapIgdbGame(externalDetails, secondsToDuration(time?.hastily || time?.normally)));
      return;
    }

  });

  const gamesWithoutDetails = games.filter((game) => !result.has(game.appId) && game.title.trim());

  if (gamesWithoutDetails.length) {
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  for (const game of gamesWithoutDetails) {
    const titleResults = await requestIgdb<IgdbGame[]>(
      "games",
      `search "${escapeSearch(game.title)}"; fields ${gameFields}; limit 5;`,
    ).catch(() => []);
    const titleMatch = findTitleMatch(titleResults ?? [], game.title);

    if (titleMatch) result.set(game.appId, mapIgdbGame(titleMatch));
    await new Promise((resolve) => setTimeout(resolve, 275));
  }

  return result;
}

export async function getCampaignHoursBySteamAppIds(appIds: number[]) {
  const result = new Map<number, string>();
  const sourceId = await getSteamSourceId();

  if (!sourceId || !appIds.length) return result;

  const appIdFilter = appIds.map((appId) => `"${appId}"`).join(",");
  const externalGames = await requestIgdb<IgdbExternalGame[]>(
    "external_games",
    `fields uid, game; where external_game_source = ${sourceId} & uid = (${appIdFilter}); limit ${appIds.length};`,
  );
  const gameIds = [...new Set((externalGames ?? [])
    .map((item) => item.game)
    .filter((gameId): gameId is number => Boolean(gameId)))];

  if (!gameIds.length) return result;

  const timeToBeats = await requestIgdb<IgdbTimeToBeat[]>(
    "game_time_to_beats",
    `fields game_id, hastily, normally; where game_id = (${gameIds.join(",")}); limit ${gameIds.length};`,
  );
  const timeByGameId = new Map((timeToBeats ?? []).map((item) => [item.game_id, item]));

  (externalGames ?? []).forEach((externalGame) => {
    const appId = Number(externalGame.uid);
    const time = timeByGameId.get(externalGame.game);
    const duration = secondsToDuration(time?.hastily || time?.normally);

    if (appId && duration) result.set(appId, duration);
  });

  return result;
}

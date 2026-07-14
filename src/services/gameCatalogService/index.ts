import type { CreateMediaDTO } from "../../schemas/media";
import { CatalogCache } from "../catalogCache";
import { requestCatalog } from "../catalogProxy";
import type { GameCatalogDetails, GameCatalogResult, IgdbGame, IgdbGameTimeToBeat, IgdbGenre, IgdbInvolvedCompany, IgdbMultiQueryResult, IgdbPlatform, SteamAppDetails, SteamAppDetailsResponse, SteamSearchItem, SteamSearchResponse } from "../types";

const maxCatalogResults = 50;
const searchCache = new CatalogCache<GameCatalogResult[]>();

const genreTranslations: Record<string, string> = {
  Action: "Ação",
  Adventure: "Aventura",
  Arcade: "Arcade",
  Card: "Cartas",
  Fighting: "Luta",
  HackAndSlash: "Hack and Slash",
  Indie: "Indie",
  MOBA: "MOBA",
  Music: "Música",
  Pinball: "Pinball",
  Platform: "Plataforma",
  PointAndClick: "Point and Click",
  Puzzle: "Quebra-cabeça",
  QuizTrivia: "Quiz",
  Racing: "Corrida",
  RealTimeStrategy: "Estratégia em Tempo Real",
  RolePlaying: "RPG",
  Shooter: "Tiro",
  Simulator: "Simulação",
  Sport: "Esporte",
  Strategy: "Estratégia",
  Tactical: "Tático",
  TurnBasedStrategy: "Estratégia por Turnos",
  VisualNovel: "Visual Novel",
};

function escapeIgdbSearch(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function stripHtml(value?: string) {
  if (!value) return "";

  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getSearchTokens(value: string) {
  return normalizeSearchText(value).split(" ").filter(Boolean);
}

function applyKnownSearchCorrections(value: string) {
  const corrections: Record<string, string> = {
    odissey: "odyssey",
    odysey: "odyssey",
    odiseey: "odyssey",
    zelda: "zelda",
  };

  return value
    .split(/\s+/)
    .map((word) => corrections[word.toLowerCase()] ?? word)
    .join(" ");
}

function normalizeCoverUrl(url?: string) {
  if (!url) return "";

  const normalizedUrl = url.startsWith("//") ? `https:${url}` : url;

  return normalizedUrl.replace("t_thumb", "t_cover_big");
}

function getReleaseYear(timestamp?: number) {
  if (!timestamp) return "";

  return String(new Date(timestamp * 1000).getFullYear());
}

function getCategory(genres?: IgdbGenre[]) {
  return genres
    ?.map((genre) => genre.name)
    .filter((genre): genre is string => Boolean(genre))
    .map((genre) => genreTranslations[genre] ?? genre)
    .slice(0, 3)
    .join(", ") ?? "";
}

function getPlatform(platforms?: IgdbPlatform[]) {
  return platforms
    ?.map((platform) => platform.name)
    .filter((platform): platform is string => Boolean(platform))
    .slice(0, 4)
    .join(", ") ?? "";
}

function getDevelopers(companies?: IgdbInvolvedCompany[]) {
  return companies
    ?.filter((item) => item.developer)
    .map((item) => item.company?.name)
    .filter((company): company is string => Boolean(company))
    .slice(0, 2)
    .join(", ") ?? "";
}

function mapIgdbGame(game: IgdbGame): GameCatalogResult {
  const cover = normalizeCoverUrl(game.cover?.url);

  return {
    id: game.id,
    source: "igdb",
    title: game.name ?? "",
    releaseYear: getReleaseYear(game.first_release_date),
    cover,
    backdrop: cover,
    category: getCategory(game.genres),
    platform: getPlatform(game.platforms),
  };
}

function getSteamReleaseYear(date?: string) {
  const year = date?.match(/\d{4}/)?.[0];

  return year ?? "";
}

function getSteamLibraryCover(appId: number) {
  return `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appId}/library_600x900.jpg`;
}

function getSteamCover(details: SteamAppDetails) {
  const appId = details.steam_appid;

  if (appId) {
    return getSteamLibraryCover(appId);
  }

  return details.capsule_imagev5 || details.capsule_image || details.header_image || "";
}

function mapSteamSearchItem(item: SteamSearchItem): GameCatalogResult {
  return {
    id: item.id,
    source: "steam",
    title: item.name,
    releaseYear: "",
    cover: getSteamLibraryCover(item.id),
    backdrop: item.tiny_image ?? "",
    category: "",
    platform: "Steam",
  };
}

function mapSteamDetails(details: SteamAppDetails, appId: number): GameCatalogDetails {
  return {
    id: details.steam_appid ?? appId,
    source: "steam",
    title: details.name ?? "",
    releaseYear: getSteamReleaseYear(details.release_date?.date),
    cover: getSteamCover(details),
    backdrop: details.header_image || details.capsule_image || details.capsule_imagev5 || "",
    category: details.genres?.map((genre) => genre.description).filter(Boolean).slice(0, 3).join(", ") ?? "",
    platform: "Steam",
    creator: details.developers?.slice(0, 2).join(", ") || details.publishers?.slice(0, 2).join(", ") || "",
    description: stripHtml(details.short_description || details.about_the_game || details.detailed_description),
    campaignHours: "",
  };
}

function scoreGameSearchResult(game: IgdbGame, query: string) {
  const normalizedQuery = normalizeSearchText(applyKnownSearchCorrections(query));
  const queryTokens = getSearchTokens(normalizedQuery);
  const names = [game.name, ...(game.alternative_names?.map((name) => name.name) ?? [])]
    .filter((name): name is string => Boolean(name))
    .map(normalizeSearchText);
  const bestName = names[0] ?? "";
  const hasExactName = names.some((name) => name === normalizedQuery);
  const hasIncludedQuery = names.some((name) => name.includes(normalizedQuery));
  const tokenMatches = queryTokens.filter((token) => names.some((name) => name.includes(token))).length;

  return (
    (hasExactName ? 1000 : 0) +
    (hasIncludedQuery ? 500 : 0) +
    tokenMatches * 120 +
    (bestName.startsWith(normalizedQuery) ? 180 : 0) +
    (game.cover ? 60 : 0) +
    (game.version_parent ? -15 : 15) +
    Math.min(game.total_rating_count ?? 0, 400)
  );
}

function mapIgdbDetails(game: IgdbGame): GameCatalogDetails {
  return {
    ...mapIgdbGame(game),
    creator: getDevelopers(game.involved_companies),
    description: game.summary ?? game.storyline ?? "",
    campaignHours: "",
  };
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

function getCampaignHoursFromTimeToBeat(timeToBeat?: IgdbGameTimeToBeat) {
  return secondsToDuration(timeToBeat?.normally || timeToBeat?.hastily || timeToBeat?.completely);
}

async function requestIgdb<T>(endpoint: string, query: string, signal?: AbortSignal) {
  return requestCatalog<T>("igdb", endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body: query,
    signal,
  });
}

async function requestSteam<T>(endpoint: string, searchParams: URLSearchParams, signal?: AbortSignal) {
  return requestCatalog<T>("steam", endpoint, { searchParams, signal });
}

async function searchSteamGames(query: string, signal?: AbortSignal) {
  const data = await requestSteam<SteamSearchResponse>(
    "api/storesearch/",
    new URLSearchParams({
      term: query,
      l: "brazilian",
      cc: "BR",
      count: String(maxCatalogResults),
    }),
    signal
  );

  return data.items?.map(mapSteamSearchItem) ?? [];
}

async function getSteamAppDetails(appId: number, language: "brazilian" | "portuguese", signal?: AbortSignal) {
  const data = await requestSteam<SteamAppDetailsResponse>(
    "api/appdetails",
    new URLSearchParams({
      appids: String(appId),
      l: language,
      cc: "BR",
    }),
    signal
  );

  const result = data[String(appId)];

  if (!result?.success || !result.data) return null;

  return result.data;
}

async function getIgdbTimeToBeat(game: Pick<IgdbGame, "id" | "version_parent">, signal?: AbortSignal) {
  const gameIds = Array.from(new Set([game.version_parent, game.id].filter((id): id is number => Boolean(id))));
  const gameIdFilter = gameIds.length === 1 ? String(gameIds[0]) : `(${gameIds.join(",")})`;
  const results = await requestIgdb<IgdbGameTimeToBeat[]>(
    "game_time_to_beats",
    `
      fields game_id, hastily, normally, completely, count;
      where game_id = ${gameIdFilter};
      limit ${gameIds.length};
    `,
    signal
  ).catch((error) => {
    if (isAbortError(error)) throw error;
    return [];
  });

  const resultsByPreference = gameIds
    .map((gameId) => results.find((result) => result.game_id === gameId))
    .filter((result): result is IgdbGameTimeToBeat => Boolean(result));
  const campaignSeconds = resultsByPreference.find((result) => result.normally)?.normally
    || resultsByPreference.find((result) => result.hastily)?.hastily
    || resultsByPreference.find((result) => result.completely)?.completely;

  return secondsToDuration(campaignSeconds);
}

async function getIgdbGameByTitle(title: string, signal?: AbortSignal) {
  const games = await requestIgdb<IgdbGame[]>(
    "games",
    `
      search "${escapeIgdbSearch(title)}";
      fields name, alternative_names.name, cover.url, first_release_date, genres.name, platforms.name, total_rating_count, version_parent;
      limit 5;
    `,
    signal
  ).catch((error) => {
    if (isAbortError(error)) throw error;
    return [];
  });

  return games
    .sort((firstGame, secondGame) => scoreGameSearchResult(secondGame, title) - scoreGameSearchResult(firstGame, title))[0]
    ?? null;
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

function getMultiQueryArray<T>(results: IgdbMultiQueryResult[], name: string) {
  const value = results.find((result) => result.name === name)?.result;

  return Array.isArray(value) ? value as T[] : [];
}

export async function searchGames(query: string, signal?: AbortSignal): Promise<GameCatalogResult[]> {
  const normalizedQuery = normalizeSearchText(query);
  const cachedResults = searchCache.get(normalizedQuery);

  if (cachedResults) return cachedResults;

  const igdbSearchQuery = applyKnownSearchCorrections(query.trim());
  const [steamRequest, igdbRequest] = await Promise.allSettled([
    searchSteamGames(query, signal),
    requestIgdb<IgdbGame[]>(
      "games",
      `
        search "${escapeIgdbSearch(igdbSearchQuery)}";
        fields name, alternative_names.name, cover.url, first_release_date, genres.name, platforms.name, category, total_rating_count, version_parent;
        where version_parent = null;
        limit ${maxCatalogResults};
      `,
      signal
    ),
  ]);
  const steamResult = steamRequest.status === "fulfilled" ? steamRequest.value : [];
  const igdbGames = igdbRequest.status === "fulfilled" ? igdbRequest.value : [];

  if (steamRequest.status === "rejected" && igdbRequest.status === "rejected") {
    throw igdbRequest.reason instanceof Error ? igdbRequest.reason : steamRequest.reason;
  }

  const igdbResults = igdbGames
    .filter((game) => Boolean(game.name))
    .sort((firstGame, secondGame) => scoreGameSearchResult(secondGame, query) - scoreGameSearchResult(firstGame, query))
    .slice(0, 10)
    .map(mapIgdbGame);

  const resultsByName = new Map<string, GameCatalogResult>();

  [...steamResult, ...igdbResults].forEach((game) => {
    const normalizedName = normalizeSearchText(game.title);
    const existingGame = resultsByName.get(normalizedName);

    if (!existingGame) {
      resultsByName.set(normalizedName, game);
      return;
    }

    if (existingGame.source === "steam" && game.source === "igdb" && game.cover) {
      resultsByName.set(normalizedName, {
        ...existingGame,
        fallbackCover: game.cover,
        category: existingGame.category || game.category,
        releaseYear: existingGame.releaseYear || game.releaseYear,
      });
    }
  });

  const results = Array.from(resultsByName.values());

  if (steamRequest.status === "fulfilled" && igdbRequest.status === "fulfilled") {
    searchCache.set(normalizedQuery, results);
  }

  return results;
}

export async function getGameDetails(gameResult: GameCatalogResult, signal?: AbortSignal): Promise<GameCatalogDetails> {
  if (gameResult.source === "steam") {
    const brazilianDetails = await getSteamAppDetails(gameResult.id, "brazilian", signal).catch((error) => {
      if (isAbortError(error)) throw error;
      return null;
    });
    const mappedBrazilianDetails = brazilianDetails ? mapSteamDetails(brazilianDetails, gameResult.id) : null;
    const needsPortugueseFallback = !mappedBrazilianDetails?.description;
    const portugueseDetails = needsPortugueseFallback
      ? await getSteamAppDetails(gameResult.id, "portuguese", signal).catch((error) => {
          if (isAbortError(error)) throw error;
          return null;
        })
      : null;
    const mappedPortugueseDetails = portugueseDetails ? mapSteamDetails(portugueseDetails, gameResult.id) : null;

    if (mappedBrazilianDetails) {
      const igdbGame = await getIgdbGameByTitle(mappedBrazilianDetails.title, signal);
      const igdbFallbackCover = normalizeCoverUrl(igdbGame?.cover?.url);

      return {
        ...mappedBrazilianDetails,
        fallbackCover: gameResult.fallbackCover || igdbFallbackCover,
        description: mappedBrazilianDetails.description || mappedPortugueseDetails?.description || "",
        campaignHours: igdbGame ? await getIgdbTimeToBeat(igdbGame, signal) : "",
      };
    }

    if (mappedPortugueseDetails) {
      const igdbGame = await getIgdbGameByTitle(mappedPortugueseDetails.title, signal);
      const igdbFallbackCover = normalizeCoverUrl(igdbGame?.cover?.url);

      return {
        ...mappedPortugueseDetails,
        fallbackCover: gameResult.fallbackCover || igdbFallbackCover,
        campaignHours: igdbGame ? await getIgdbTimeToBeat(igdbGame, signal) : "",
      };
    }

    throw new Error("Não foi possivel carregar os detalhes do jogo na Steam.");
  }

  const detailResults = await requestIgdb<IgdbMultiQueryResult[]>(
    "multiquery",
    `
      query games "game-details" {
        fields name, summary, storyline, cover.url, first_release_date, genres.name, platforms.name, involved_companies.developer, involved_companies.company.name;
        where id = ${gameResult.id};
        limit 1;
      };
      query game_time_to_beats "time-to-beat" {
        fields game_id, hastily, normally, completely, count;
        where game_id = ${gameResult.id};
        limit 1;
      };
    `,
    signal
  );

  const igdbGame = getMultiQueryArray<IgdbGame>(detailResults, "game-details")[0];
  const timeToBeat = getMultiQueryArray<IgdbGameTimeToBeat>(detailResults, "time-to-beat")[0];

  if (!igdbGame) {
    throw new Error("Não foi possivel carregar os detalhes do jogo.");
  }

  return {
    ...mapIgdbDetails(igdbGame),
    campaignHours: getCampaignHoursFromTimeToBeat(timeToBeat),
  };
}

export function applyGameCatalogDetails(game: GameCatalogDetails): Partial<CreateMediaDTO> {
  return {
    title: game.title,
    creator: game.creator,
    category: game.category,
    cover: game.cover,
    backdrop: game.backdrop ?? "",
    release_year: game.releaseYear,
    campaign_hours: game.campaignHours,
    meta: game.platform,
    description: game.description,
  };
}

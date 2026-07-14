import type { CreateMediaDTO } from "../../schemas/media";
import { CatalogCache } from "../catalogCache";
import { requestCatalog } from "../catalogProxy";
import type { GameCatalogDetails, GameCatalogEnrichment, GameCatalogResult, GameCatalogSearchListener, IgdbGame, IgdbGameCacheEntry, IgdbGameTimeToBeat, IgdbGenre, IgdbInvolvedCompany, IgdbMultiQueryResult, IgdbPlatform, SteamAppDetails, SteamAppDetailsResponse, SteamSearchItem, SteamSearchResponse } from "../types";
import { campaignParentGameTypes, excludedIgdbSearchGameTypes, gameCatalogWarmupTtlMs, maxCatalogResults, maxIgdbPrefetchResults, maxIgdbSearchResults } from "./consts";

const searchCache = new CatalogCache<GameCatalogResult[]>();
const igdbDetailsCache = new CatalogCache<IgdbGameCacheEntry>();
const igdbGameByNameCache = new CatalogCache<IgdbGame>();
const igdbDetailsPrefetches = new Map<number, Promise<void>>();
let activeIgdbSearchPromise: Promise<IgdbGame[]> | null = null;
let gameCatalogWarmupPromise: Promise<void> | null = null;
let gameCatalogWarmedAt = 0;

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
  };

  return value
    .split(/\s+/)
    .map((word) => corrections[word.toLowerCase()] ?? word)
    .join(" ");
}

function sanitizeIgdbSearch(value: string) {
  return applyKnownSearchCorrections(value)
    .replace(/[©®™]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
    igdbId: game.id,
    igdbGameType: game.game_type,
    igdbParentGame: game.parent_game,
    igdbVersionParent: game.version_parent,
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

function cacheIgdbGame(game: IgdbGame) {
  [game.name, ...(game.alternative_names?.map((name) => name.name) ?? [])]
    .filter((name): name is string => Boolean(name))
    .forEach((name) => igdbGameByNameCache.set(normalizeSearchText(name), game));

  const cacheKey = String(game.id);

  if (!igdbDetailsCache.get(cacheKey)) {
    igdbDetailsCache.set(cacheKey, {
      details: mapIgdbDetails(game),
      hasTimeToBeatLookup: false,
    });
  }
}

function mergeGameSearchResults(
  query: string,
  steamResults: GameCatalogResult[],
  igdbGames: IgdbGame[],
) {
  igdbGames.forEach(cacheIgdbGame);

  const rankedIgdbGames = igdbGames
    .filter((game) => Boolean(game.name))
    .sort((firstGame, secondGame) => scoreGameSearchResult(secondGame, query) - scoreGameSearchResult(firstGame, query));
  const steamResultsWithIgdb = steamResults.map((game) => {
    const igdbGame = igdbGameByNameCache.get(normalizeSearchText(game.title))
      ?? findMatchingIgdbGame(igdbGames, game.title);

    if (!igdbGame) return game;

    const igdbResult = mapIgdbGame(igdbGame);

    return {
      ...game,
      igdbId: igdbGame.id,
      igdbGameType: igdbGame.game_type,
      igdbParentGame: igdbGame.parent_game,
      igdbVersionParent: igdbGame.version_parent,
      fallbackCover: igdbResult.cover,
      category: game.category || igdbResult.category,
      releaseYear: game.releaseYear || igdbResult.releaseYear,
    };
  });
  const igdbResults = rankedIgdbGames
    .slice(0, 10)
    .map(mapIgdbGame);
  const resultsByName = new Map<string, GameCatalogResult>();

  [...steamResultsWithIgdb, ...igdbResults].forEach((game) => {
    const normalizedName = normalizeSearchText(game.title);
    const existingGame = resultsByName.get(normalizedName);

    if (!existingGame) {
      resultsByName.set(normalizedName, game);
      return;
    }

    if (existingGame.source === "steam" && game.source === "igdb") {
      resultsByName.set(normalizedName, {
        ...existingGame,
        igdbId: game.igdbId ?? game.id,
        igdbGameType: game.igdbGameType,
        igdbParentGame: game.igdbParentGame,
        igdbVersionParent: game.igdbVersionParent,
        fallbackCover: game.cover || existingGame.fallbackCover,
        category: existingGame.category || game.category,
        releaseYear: existingGame.releaseYear || game.releaseYear,
      });
    }
  });

  return Array.from(resultsByName.values());
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
  return secondsToDuration(timeToBeat?.hastily || timeToBeat?.normally);
}

function getPreferredTimeToBeat(results: IgdbGameTimeToBeat[], gameIds: number[]) {
  const resultsByPreference = gameIds
    .map((gameId) => results.find((result) => result.game_id === gameId))
    .filter((result): result is IgdbGameTimeToBeat => Boolean(result));

  return resultsByPreference.find((result) => result.hastily)
    ?? resultsByPreference.find((result) => result.normally)
    ?? resultsByPreference[0];
}

function getGameTimeToBeatIds(game: GameCatalogResult, igdbId: number, cachedGame?: IgdbGame | null) {
  const gameType = game.igdbGameType ?? cachedGame?.game_type;
  const parentGame = gameType !== undefined && campaignParentGameTypes.has(gameType)
    ? game.igdbParentGame ?? cachedGame?.parent_game
    : undefined;

  return Array.from(new Set([
    parentGame,
    game.igdbVersionParent ?? cachedGame?.version_parent,
    igdbId,
  ].filter((id): id is number => Boolean(id))));
}

function cacheCompleteIgdbDetails(
  cacheKey: string,
  game: IgdbGame,
  timeToBeatResults: IgdbGameTimeToBeat[],
  gameIds: number[],
) {
  const details = {
    ...mapIgdbDetails(game),
    campaignHours: getCampaignHoursFromTimeToBeat(getPreferredTimeToBeat(timeToBeatResults, gameIds)),
  };

  igdbDetailsCache.set(cacheKey, { details, hasTimeToBeatLookup: true });

  return details;
}

function cacheIgdbTimeToBeat(
  cacheKey: string,
  timeToBeatResults: IgdbGameTimeToBeat[],
  gameIds: number[],
) {
  const cachedEntry = igdbDetailsCache.get(cacheKey);

  if (!cachedEntry) return;

  igdbDetailsCache.set(cacheKey, {
    details: {
      ...cachedEntry.details,
      campaignHours: getCampaignHoursFromTimeToBeat(getPreferredTimeToBeat(timeToBeatResults, gameIds)),
    },
    hasTimeToBeatLookup: true,
  });
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

export function warmGameCatalog() {
  if (Date.now() - gameCatalogWarmedAt < gameCatalogWarmupTtlMs) return Promise.resolve();
  if (gameCatalogWarmupPromise) return gameCatalogWarmupPromise;

  const warmupPromise = requestIgdb<IgdbGame[]>("games", "fields id; limit 1;")
    .then(() => {
      gameCatalogWarmedAt = Date.now();
    })
    .catch((error) => {
      if (!isAbortError(error)) console.warn("Nao foi possivel aquecer o catalogo do IGDB.", error);
    });

  gameCatalogWarmupPromise = warmupPromise;

  void warmupPromise.finally(() => {
    if (gameCatalogWarmupPromise === warmupPromise) {
      gameCatalogWarmupPromise = null;
    }
  });

  return warmupPromise;
}

async function prefetchIgdbDetails(games: GameCatalogResult[], signal?: AbortSignal) {
  const candidates = games
    .map((game) => {
      const id = game.source === "igdb" ? game.id : game.igdbId;

      if (
        !id
        || igdbDetailsCache.get(String(id))?.hasTimeToBeatLookup
        || igdbDetailsPrefetches.has(id)
      ) return null;

      const gameIds = getGameTimeToBeatIds(game, id);

      return { gameIds, id };
    })
    .filter((game): game is { gameIds: number[]; id: number } => Boolean(game))
    .filter((game, index, items) => items.findIndex((item) => item.id === game.id) === index)
    .slice(0, maxIgdbPrefetchResults);

  if (!candidates.length) return;

  const candidateGameIds = Array.from(new Set(candidates.flatMap(({ gameIds }) => gameIds)));
  const gameIdFilter = candidateGameIds.length === 1
    ? String(candidateGameIds[0])
    : `(${candidateGameIds.join(",")})`;
  const prefetchPromise = requestIgdb<IgdbGameTimeToBeat[]>(
    "game_time_to_beats",
    `
      fields game_id, hastily, normally;
      where game_id = ${gameIdFilter};
      limit ${candidateGameIds.length};
    `,
    signal,
  )
    .then((results) => {
      candidates.forEach(({ gameIds, id }) => {
        cacheIgdbTimeToBeat(String(id), results, gameIds);
      });
    });

  candidates.forEach(({ id }) => igdbDetailsPrefetches.set(id, prefetchPromise));

  try {
    await prefetchPromise;
  } finally {
    candidates.forEach(({ id }) => {
      if (igdbDetailsPrefetches.get(id) === prefetchPromise) {
        igdbDetailsPrefetches.delete(id);
      }
    });
  }
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

async function getSteamAppDetails(appId: number, signal?: AbortSignal) {
  const data = await requestSteam<SteamAppDetailsResponse>(
    "api/appdetails",
    new URLSearchParams({
      appids: String(appId),
      l: "brazilian",
      cc: "BR",
    }),
    signal
  );

  const result = data[String(appId)];

  if (!result?.success || !result.data) return null;

  return result.data;
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

function getMultiQueryArray<T>(results: IgdbMultiQueryResult[], name: string) {
  const value = results.find((result) => result.name === name)?.result;

  return Array.isArray(value) ? value as T[] : [];
}

async function getCachedIgdbDetails(game: GameCatalogResult, signal?: AbortSignal) {
  let cachedGame = game.source === "steam" && !game.igdbId
    ? igdbGameByNameCache.get(normalizeSearchText(game.title))
    : null;
  let igdbId = game.source === "igdb" ? game.id : game.igdbId ?? cachedGame?.id;

  if (!igdbId && activeIgdbSearchPromise) {
    const activeSearchGames = await activeIgdbSearchPromise.catch(() => []);

    cachedGame = findMatchingIgdbGame(activeSearchGames, game.title);

    if (cachedGame) {
      cacheIgdbGame(cachedGame);
      igdbId = cachedGame.id;
    }
  }

  if (!igdbId) {
    const games = await requestIgdb<IgdbGame[]>(
      "games",
      `
        search "${escapeIgdbSearch(sanitizeIgdbSearch(game.title))}";
        fields name, alternative_names.name, summary, storyline, cover.url, first_release_date, genres.name, platforms.name, involved_companies.developer, involved_companies.company.name, game_type, parent_game, total_rating_count, version_parent;
        where version_parent != null | game_type != (${excludedIgdbSearchGameTypes.join(",")});
        limit 5;
      `,
      signal
    ).catch((error) => {
      if (isAbortError(error)) throw error;
      return [];
    });

    cachedGame = games
      .sort((firstGame, secondGame) => scoreGameSearchResult(secondGame, game.title) - scoreGameSearchResult(firstGame, game.title))[0]
      ?? null;

    if (cachedGame) {
      cacheIgdbGame(cachedGame);
      igdbId = cachedGame.id;
    }
  }

  if (!igdbId) return null;

  const cacheKey = String(igdbId);
  const cachedEntry = igdbDetailsCache.get(cacheKey);

  if (cachedEntry?.hasTimeToBeatLookup) return cachedEntry.details;

  const prefetchPromise = igdbDetailsPrefetches.get(igdbId);

  if (prefetchPromise) {
    await prefetchPromise.catch(() => undefined);

    const prefetchedEntry = igdbDetailsCache.get(cacheKey);

    if (prefetchedEntry?.hasTimeToBeatLookup) return prefetchedEntry.details;
  }

  const gameIds = getGameTimeToBeatIds(game, igdbId, cachedGame);
  const gameIdFilter = gameIds.length === 1 ? String(gameIds[0]) : `(${gameIds.join(",")})`;
  const detailResults = await requestIgdb<IgdbMultiQueryResult[]>(
    "multiquery",
    `
      query games "game-details" {
        fields name, summary, storyline, cover.url, first_release_date, genres.name, platforms.name, involved_companies.developer, involved_companies.company.name, game_type, parent_game, version_parent;
        where id = ${igdbId};
        limit 1;
      };
      query game_time_to_beats "time-to-beat" {
        fields game_id, hastily, normally;
        where game_id = ${gameIdFilter};
        limit ${gameIds.length};
      };
    `,
    signal
  ).catch((error) => {
    if (isAbortError(error)) throw error;
    return null;
  });

  if (!detailResults) return cachedEntry?.details ?? null;

  const igdbGame = getMultiQueryArray<IgdbGame>(detailResults, "game-details")[0];

  if (!igdbGame) return cachedEntry?.details ?? null;

  return cacheCompleteIgdbDetails(
    cacheKey,
    igdbGame,
    getMultiQueryArray<IgdbGameTimeToBeat>(detailResults, "time-to-beat"),
    gameIds,
  );
}

function findMatchingIgdbGame(games: IgdbGame[], title: string) {
  const normalizedTitle = normalizeSearchText(title);
  const titleTokens = getSearchTokens(normalizedTitle);

  return games
    .filter((game) => {
      const names = [game.name, ...(game.alternative_names?.map((name) => name.name) ?? [])]
        .filter((name): name is string => Boolean(name))
        .map(normalizeSearchText);

      return names.some((name) => (
        name === normalizedTitle
        || (titleTokens.length >= 3 && (name.includes(normalizedTitle) || normalizedTitle.includes(name)))
      ));
    })
    .sort((firstGame, secondGame) => scoreGameSearchResult(secondGame, title) - scoreGameSearchResult(firstGame, title))[0]
    ?? null;
}

export async function searchGames(
  query: string,
  signal?: AbortSignal,
  onResults?: GameCatalogSearchListener,
): Promise<GameCatalogResult[]> {
  const normalizedQuery = normalizeSearchText(query);
  const cachedResults = searchCache.get(normalizedQuery);

  if (cachedResults) return cachedResults;

  const igdbSearchQuery = sanitizeIgdbSearch(query);
  let steamResults: GameCatalogResult[] = [];
  let igdbGames: IgdbGame[] = [];

  const publishResults = () => {
    onResults?.(mergeGameSearchResults(query, steamResults, igdbGames));
  };
  const steamPromise = searchSteamGames(query, signal).then((results) => {
    steamResults = results;
    publishResults();

    return results;
  });
  const igdbRequestPromise = requestIgdb<IgdbGame[]>(
    "games",
    `
      search "${escapeIgdbSearch(igdbSearchQuery)}";
      fields name, alternative_names.name, summary, storyline, cover.url, first_release_date, genres.name, platforms.name, involved_companies.developer, involved_companies.company.name, game_type, parent_game, total_rating_count, version_parent;
      where version_parent != null | game_type != (${excludedIgdbSearchGameTypes.join(",")});
      limit ${maxIgdbSearchResults};
    `,
    signal,
  );

  activeIgdbSearchPromise = igdbRequestPromise;

  const igdbPromise = igdbRequestPromise
    .then((games) => {
      igdbGames = games;
      const results = mergeGameSearchResults(query, steamResults, igdbGames);

      onResults?.(results);
      void prefetchIgdbDetails(results, signal).catch((error) => {
        if (!isAbortError(error)) console.warn("Nao foi possivel antecipar os detalhes do IGDB.", error);
      });

      return games;
    })
    .finally(() => {
      if (activeIgdbSearchPromise === igdbRequestPromise) {
        activeIgdbSearchPromise = null;
      }
    });
  const [steamRequest, igdbRequest] = await Promise.allSettled([steamPromise, igdbPromise]);

  if (steamRequest.status === "rejected" && igdbRequest.status === "rejected") {
    throw igdbRequest.reason instanceof Error ? igdbRequest.reason : steamRequest.reason;
  }

  const results = mergeGameSearchResults(query, steamResults, igdbGames);

  if (steamRequest.status === "fulfilled" && igdbRequest.status === "fulfilled") {
    searchCache.set(normalizedQuery, results);
  }

  return results;
}

export async function getGameDetails(gameResult: GameCatalogResult, signal?: AbortSignal): Promise<GameCatalogDetails> {
  if (gameResult.source === "steam") {
    const brazilianDetails = await getSteamAppDetails(gameResult.id, signal).catch((error) => {
      if (isAbortError(error)) throw error;
      return null;
    });
    const mappedBrazilianDetails = brazilianDetails ? mapSteamDetails(brazilianDetails, gameResult.id) : null;

    if (mappedBrazilianDetails) {
      return {
        ...mappedBrazilianDetails,
        igdbId: gameResult.igdbId,
        igdbGameType: gameResult.igdbGameType,
        igdbParentGame: gameResult.igdbParentGame,
        igdbVersionParent: gameResult.igdbVersionParent,
        fallbackCover: gameResult.fallbackCover,
      };
    }

    return {
      ...gameResult,
      creator: "",
      description: "",
      campaignHours: "",
    };
  }

  const igdbDetails = await getCachedIgdbDetails(gameResult, signal);

  if (!igdbDetails) {
    throw new Error("Não foi possivel carregar os detalhes do jogo.");
  }

  return igdbDetails;
}

export async function getGameEnrichment(
  game: GameCatalogResult,
  signal?: AbortSignal,
): Promise<GameCatalogEnrichment> {
  const igdbDetails = await getCachedIgdbDetails(game, signal);

  return {
    campaignHours: igdbDetails?.campaignHours || "",
    category: igdbDetails?.category || "",
    creator: igdbDetails?.creator || "",
    description: igdbDetails?.description || "",
    fallbackCover: game.fallbackCover || igdbDetails?.cover || "",
    releaseYear: igdbDetails?.releaseYear || "",
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

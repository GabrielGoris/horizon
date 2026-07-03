import type { CreateMediaDTO } from "../schemas/media";
import type { GameCatalogDetails, GameCatalogResult, IgdbGame, IgdbGenre, IgdbInvolvedCompany, IgdbPlatform, IgdbSearchResult, SteamAppDetails, SteamAppDetailsResponse, SteamSearchItem, SteamSearchResponse } from "./types";

const igdbBaseUrl = "/igdb-api";
const steamBaseUrl = "/steam-api";
const maxCatalogResults = 50;
const searchCache = new Map<string, GameCatalogResult[]>();

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

function getSearchVariations(query: string) {
  const trimmedQuery = query.trim();
  const correctedQuery = applyKnownSearchCorrections(trimmedQuery);
  const variations = [trimmedQuery, correctedQuery];
  const normalizedCorrectedQuery = normalizeSearchText(correctedQuery);
  const tokens = getSearchTokens(correctedQuery);

  if (normalizedCorrectedQuery.startsWith("mario ") && !normalizedCorrectedQuery.startsWith("super mario ")) {
    variations.push(`super ${correctedQuery}`);
  }

  if (normalizedCorrectedQuery.startsWith("zelda ") && !normalizedCorrectedQuery.startsWith("the legend of zelda ")) {
    variations.push(`the legend of ${correctedQuery}`);
  }

  const longestToken = [...tokens].sort((firstToken, secondToken) => secondToken.length - firstToken.length)[0];

  if (longestToken && longestToken.length >= 5) {
    variations.push(longestToken);
  }

  return Array.from(new Set(variations.filter(Boolean)));
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

function getSteamPlatform(platforms?: SteamAppDetails["platforms"]) {
  const platformLabels = [
    platforms?.windows ? "PC" : "",
    platforms?.mac ? "Mac" : "",
    platforms?.linux ? "Linux" : "",
  ].filter(Boolean);

  return platformLabels.join(", ");
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
    platform: "PC",
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
    platform: getSteamPlatform(details.platforms),
    creator: details.developers?.slice(0, 2).join(", ") || details.publishers?.slice(0, 2).join(", ") || "",
    description: stripHtml(details.short_description || details.about_the_game || details.detailed_description),
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
  };
}

async function requestIgdb<T>(endpoint: string, query: string) {
  const response = await fetch(`${igdbBaseUrl}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body: query,
  });

  if (!response.ok) {
    const message = await response.text();

    throw new Error(message || "Nao foi possivel buscar jogos agora.");
  }

  return (await response.json()) as T;
}

async function requestSteam<T>(endpoint: string, searchParams: URLSearchParams) {
  const response = await fetch(`${steamBaseUrl}/${endpoint}?${searchParams.toString()}`);

  if (!response.ok) {
    const message = await response.text();

    throw new Error(message || "Nao foi possivel consultar a Steam agora.");
  }

  return (await response.json()) as T;
}

async function searchSteamGames(query: string) {
  const data = await requestSteam<SteamSearchResponse>(
    "api/storesearch/",
    new URLSearchParams({
      term: query,
      l: "brazilian",
      cc: "BR",
      count: String(maxCatalogResults),
    })
  );

  return data.items?.map(mapSteamSearchItem) ?? [];
}

async function getSteamAppDetails(appId: number, language: "brazilian" | "portuguese") {
  const data = await requestSteam<SteamAppDetailsResponse>(
    "api/appdetails",
    new URLSearchParams({
      appids: String(appId),
      l: language,
      cc: "BR",
    })
  );

  const result = data[String(appId)];

  if (!result?.success || !result.data) return null;

  return result.data;
}

export async function searchGames(query: string): Promise<GameCatalogResult[]> {
  const normalizedQuery = normalizeSearchText(query);

  if (searchCache.has(normalizedQuery)) {
    return searchCache.get(normalizedQuery) ?? [];
  }

  const searchVariations = getSearchVariations(query);
  const steamPromise = searchSteamGames(query);
  const igdbGamePromises = searchVariations.map((searchVariation) =>
    requestIgdb<IgdbGame[]>(
      "games",
      `
          search "${escapeIgdbSearch(searchVariation)}";
          fields name, alternative_names.name, cover.url, first_release_date, genres.name, platforms.name, category, total_rating_count, version_parent;
          limit ${maxCatalogResults};
        `
    )
  );
  const igdbSearchPromises = searchVariations.map((searchVariation) =>
    requestIgdb<IgdbSearchResult[]>(
      "search",
      `
          search "${escapeIgdbSearch(searchVariation)}";
          fields name, game;
          where game != null;
          limit ${maxCatalogResults};
        `
    )
  );

  const [steamResult, igdbGameResults, igdbSearchResults] = await Promise.all([
    steamPromise.catch((error) => {
      console.warn("Steam search failed, falling back to IGDB.", error);
      return [];
    }),
    Promise.allSettled(igdbGamePromises),
    Promise.allSettled(igdbSearchPromises),
  ]);
  const gamesById = new Map<number, IgdbGame>();
  const searchGameIds = new Set<number>();

  igdbGameResults.forEach((result) => {
    if (result.status === "fulfilled") {
      result.value.forEach((game) => gamesById.set(game.id, game));
    }
  });

  igdbSearchResults.forEach((result) => {
    if (result.status === "fulfilled") {
      result.value.forEach((searchResult) => {
        if (searchResult.game) {
          searchGameIds.add(searchResult.game);
        }
      });
    }
  });

  if (gamesById.size === 0 && steamResult.length === 0) {
    const rejectedResult = [...igdbGameResults, ...igdbSearchResults].find((result) => result.status === "rejected");

    if (rejectedResult?.status === "rejected") {
      throw rejectedResult.reason;
    }
  }

  const missingSearchGameIds = Array.from(searchGameIds).filter((gameId) => !gamesById.has(gameId));

  if (missingSearchGameIds.length > 0) {
    const games = await requestIgdb<IgdbGame[]>(
      "games",
      `
        fields name, alternative_names.name, cover.url, first_release_date, genres.name, platforms.name, category, total_rating_count, version_parent;
        where id = (${missingSearchGameIds.slice(0, maxCatalogResults * 2).join(",")});
        limit ${maxCatalogResults * 2};
      `
    );

    games.forEach((game) => gamesById.set(game.id, game));
  }

  const igdbResults = Array.from(gamesById.values())
    .filter((game) => Boolean(game.name))
    .sort((firstGame, secondGame) => scoreGameSearchResult(secondGame, query) - scoreGameSearchResult(firstGame, query))
    .slice(0, 10)
    .map(mapIgdbGame);

  const resultsByName = new Map<string, GameCatalogResult>();

  [...steamResult, ...igdbResults].forEach((game) => {
    const normalizedName = normalizeSearchText(game.title);

    if (!resultsByName.has(normalizedName)) {
      resultsByName.set(normalizedName, game);
    }
  });

  const results = Array.from(resultsByName.values());

  searchCache.set(normalizedQuery, results);

  return results;
}

export async function getGameDetails(gameResult: GameCatalogResult): Promise<GameCatalogDetails> {
  if (gameResult.source === "steam") {
    const brazilianDetails = await getSteamAppDetails(gameResult.id, "brazilian");
    const portugueseDetails = await getSteamAppDetails(gameResult.id, "portuguese");
    const mappedBrazilianDetails = brazilianDetails ? mapSteamDetails(brazilianDetails, gameResult.id) : null;
    const mappedPortugueseDetails = portugueseDetails ? mapSteamDetails(portugueseDetails, gameResult.id) : null;

    if (mappedBrazilianDetails) {
      return {
        ...mappedBrazilianDetails,
        description: mappedBrazilianDetails.description || mappedPortugueseDetails?.description || "",
      };
    }

    if (mappedPortugueseDetails) {
      return mappedPortugueseDetails;
    }

    throw new Error("Nao foi possivel carregar os detalhes do jogo na Steam.");
  }

  const games = await requestIgdb<IgdbGame[]>(
    "games",
    `
      fields name, summary, storyline, cover.url, first_release_date, genres.name, platforms.name, involved_companies.developer, involved_companies.company.name;
      where id = ${gameResult.id};
      limit 1;
    `
  );

  const igdbGame = games[0];

  if (!igdbGame) {
    throw new Error("Nao foi possivel carregar os detalhes do jogo.");
  }

  return mapIgdbDetails(igdbGame);
}

export function applyGameCatalogDetails(game: GameCatalogDetails): Partial<CreateMediaDTO> {
  return {
    title: game.title,
    creator: game.creator,
    category: game.category,
    cover: game.cover,
    backdrop: game.backdrop ?? "",
    release_year: game.releaseYear,
    meta: game.platform,
    description: game.description,
  };
}

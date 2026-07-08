import type { CreateMediaDTO } from "../schemas/media";
import type {
  MovieCatalogDetails,
  MovieCatalogResult,
  TmdbDetails,
  TmdbGenre,
  TmdbGenreResponse,
  TmdbMediaType,
  TmdbSearchItem,
  TmdbSearchResponse,
} from "./types";

const internalApiPrefix = import.meta.env.PROD ? "/api" : "";
const tmdbBaseUrl = `${internalApiPrefix}/tmdb-api`;
const imageBaseUrl = "https://image.tmdb.org/t/p";
const searchCache = new Map<string, MovieCatalogResult[]>();
let genreCache: Record<TmdbMediaType, TmdbGenre[]> | null = null;

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getImageUrl(path: string | null | undefined, size: "w500" | "w1280") {
  return path ? `${imageBaseUrl}/${size}${path}` : "";
}

function getReleaseYear(item: Pick<TmdbSearchItem, "release_date" | "first_air_date">) {
  const date = item.release_date || item.first_air_date;

  return date?.slice(0, 4) ?? "";
}

function getOriginLabel(originCountry?: string[], originalLanguage?: string) {
  return originCountry?.[0] || originalLanguage?.toUpperCase() || "";
}

function getGenreNames(genres?: TmdbGenre[]) {
  return genres?.map((genre) => genre.name).filter(Boolean).slice(0, 3).join(", ") ?? "";
}

function getGenreNamesById(genreIds: number[] | undefined, genres: TmdbGenre[]) {
  if (!genreIds?.length) return "";

  const genresById = new Map(genres.map((genre) => [genre.id, genre.name]));

  return genreIds
    .map((genreId) => genresById.get(genreId))
    .filter((genre): genre is string => Boolean(genre))
    .slice(0, 3)
    .join(", ");
}

function getDirector(details: TmdbDetails, mediaType: TmdbMediaType) {
  if (mediaType === "tv") {
    return details.created_by?.map((person) => person.name).filter(Boolean).slice(0, 2).join(", ") ?? "";
  }

  return details.credits?.crew
    ?.filter((person) => person.job === "Director")
    .map((person) => person.name)
    .filter(Boolean)
    .slice(0, 2)
    .join(", ") ?? "";
}

function getCreator(details: TmdbDetails, mediaType: TmdbMediaType) {
  const companies = mediaType === "tv" ? details.networks || details.production_companies : details.production_companies;

  return companies?.map((company) => company.name).filter(Boolean).slice(0, 2).join(", ") ?? "";
}

function getRuntimeMinutes(details: TmdbDetails, mediaType: TmdbMediaType) {
  if (mediaType !== "movie") return "";

  return formatMinutes(details.runtime);
}

function getEpisodeCount(details: TmdbDetails) {
  if (details.number_of_episodes) return details.number_of_episodes;

  return details.seasons?.reduce((total, season) => total + (season.episode_count ?? 0), 0);
}

function formatMinutes(totalMinutes?: number) {
  if (!totalMinutes) return "";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!hours) return `${minutes} min`;
  if (!minutes) return `${hours}h`;

  return `${hours}h ${minutes} min`;
}

async function requestTmdb<T>(endpoint: string, searchParams?: URLSearchParams) {
  const query = searchParams?.toString();
  const response = await fetch(`${tmdbBaseUrl}/${endpoint}${query ? `?${query}` : ""}`);

  if (!response.ok) {
    const message = await response.text();

    throw new Error(message || "Nao foi possivel buscar filmes e series agora.");
  }

  return (await response.json()) as T;
}

async function getGenres() {
  if (genreCache) return genreCache;

  const [movieGenres, tvGenres] = await Promise.all([
    requestTmdb<TmdbGenreResponse>(
      "genre/movie/list",
      new URLSearchParams({ language: "pt-BR" })
    ),
    requestTmdb<TmdbGenreResponse>(
      "genre/tv/list",
      new URLSearchParams({ language: "pt-BR" })
    ),
  ]);

  genreCache = {
    movie: movieGenres.genres ?? [],
    tv: tvGenres.genres ?? [],
  };

  return genreCache;
}

function mapTmdbSearchItem(item: TmdbSearchItem, genres: Record<TmdbMediaType, TmdbGenre[]>): MovieCatalogResult | null {
  if (item.media_type !== "movie" && item.media_type !== "tv") return null;

  const title = item.title || item.name || "";

  if (!title) return null;

  return {
    id: item.id,
    source: "tmdb",
    mediaType: item.media_type,
    title,
    releaseYear: getReleaseYear(item),
    cover: getImageUrl(item.poster_path, "w500"),
    backdrop: getImageUrl(item.backdrop_path, "w1280"),
    category: getGenreNamesById(item.genre_ids, genres[item.media_type]),
    meta: getOriginLabel(item.origin_country),
  };
}

function mapTmdbDetails(details: TmdbDetails, mediaType: TmdbMediaType): MovieCatalogDetails {
  const episodeCount = mediaType === "tv" ? getEpisodeCount(details) : undefined;

  return {
    id: details.id,
    source: "tmdb",
    mediaType,
    title: details.title || details.name || "",
    releaseYear: getReleaseYear(details),
    cover: getImageUrl(details.poster_path, "w500"),
    backdrop: getImageUrl(details.backdrop_path, "w1280"),
    category: getGenreNames(details.genres),
    meta: getOriginLabel(details.origin_country, details.original_language),
    creator: getCreator(details, mediaType),
    director: getDirector(details, mediaType),
    description: details.overview ?? "",
    runtimeMinutes: getRuntimeMinutes(details, mediaType),
    seasonCount: mediaType === "tv" && details.number_of_seasons ? String(details.number_of_seasons) : "",
    episodeCount: episodeCount ? String(episodeCount) : "",
  };
}

export async function searchMovies(query: string): Promise<MovieCatalogResult[]> {
  const normalizedQuery = normalizeSearchText(query);

  if (searchCache.has(normalizedQuery)) {
    return searchCache.get(normalizedQuery) ?? [];
  }

  const [genres, data] = await Promise.all([
    getGenres(),
    requestTmdb<TmdbSearchResponse>(
      "search/multi",
      new URLSearchParams({
        query,
        language: "pt-BR",
        include_adult: "false",
        page: "1",
      })
    ),
  ]);

  const results = data.results
    ?.map((item) => mapTmdbSearchItem(item, genres))
    .filter((item): item is MovieCatalogResult => Boolean(item))
    .slice(0, 20) ?? [];

  searchCache.set(normalizedQuery, results);

  return results;
}

export async function getMovieDetails(movie: MovieCatalogResult): Promise<MovieCatalogDetails> {
  const details = await requestTmdb<TmdbDetails>(
    `${movie.mediaType}/${movie.id}`,
    new URLSearchParams({
      language: "pt-BR",
      append_to_response: "credits",
    })
  );

  return mapTmdbDetails(details, movie.mediaType);
}

export function applyMovieCatalogDetails(movie: MovieCatalogDetails): Partial<CreateMediaDTO> {
  return {
    title: movie.title,
    movie_kind: movie.mediaType === "tv" ? "series" : "movie",
    creator: movie.creator,
    director: movie.director,
    category: movie.category,
    cover: movie.cover,
    backdrop: movie.backdrop ?? "",
    release_year: movie.releaseYear,
    runtime_minutes: movie.runtimeMinutes,
    season_count: movie.seasonCount,
    episode_count: movie.episodeCount,
    meta: movie.meta,
    description: movie.description,
  };
}

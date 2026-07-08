export type IgdbGenre = {
  name?: string;
};

export type IgdbPlatform = {
  name?: string;
};

export type IgdbCover = {
  url?: string;
};

export type IgdbCompany = {
  name?: string;
};

export type IgdbInvolvedCompany = {
  developer?: boolean;
  company?: IgdbCompany;
};

export type IgdbGame = {
  id: number;
  name?: string;
  summary?: string;
  storyline?: string;
  first_release_date?: number;
  category?: number;
  total_rating_count?: number;
  version_parent?: number;
  alternative_names?: Array<{ name?: string }>;
  cover?: IgdbCover;
  genres?: IgdbGenre[];
  platforms?: IgdbPlatform[];
  involved_companies?: IgdbInvolvedCompany[];
};

export type IgdbSearchResult = {
  game?: number;
  name?: string;
};

export type IgdbGameTimeToBeat = {
  game_id?: number;
  hastily?: number;
  normally?: number;
  completely?: number;
  count?: number;
};

export type SteamSearchItem = {
  id: number;
  name: string;
  tiny_image?: string;
};

export type SteamSearchResponse = {
  items?: SteamSearchItem[];
};

export type SteamAppDetails = {
  name?: string;
  steam_appid?: number;
  short_description?: string;
  detailed_description?: string;
  about_the_game?: string;
  header_image?: string;
  capsule_image?: string;
  capsule_imagev5?: string;
  developers?: string[];
  publishers?: string[];
  genres?: Array<{ description?: string }>;
  release_date?: {
    date?: string;
  };
  platforms?: {
    windows?: boolean;
    mac?: boolean;
    linux?: boolean;
  };
};

export type SteamAppDetailsResponse = Record<string, {
  success?: boolean;
  data?: SteamAppDetails;
}>;

export type GameCatalogResult = {
  id: number;
  source: "steam" | "igdb";
  title: string;
  releaseYear: string;
  cover: string;
  fallbackCover?: string;
  backdrop?: string;
  category: string;
  platform: string;
};

export type GameCatalogDetails = GameCatalogResult & {
  creator: string;
  description: string;
  campaignHours: string;
};

export type TmdbMediaType = "movie" | "tv";

export type TmdbGenre = {
  id: number;
  name: string;
};

export type TmdbCompany = {
  name?: string;
};

export type TmdbPerson = {
  name?: string;
  job?: string;
};

export type TmdbSearchItem = {
  id: number;
  media_type?: TmdbMediaType | string;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  genre_ids?: number[];
  overview?: string;
  origin_country?: string[];
};

export type TmdbSearchResponse = {
  results?: TmdbSearchItem[];
};

export type TmdbDetails = {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  overview?: string;
  runtime?: number;
  episode_run_time?: number[];
  number_of_episodes?: number;
  number_of_seasons?: number;
  seasons?: Array<{
    episode_count?: number;
  }>;
  genres?: TmdbGenre[];
  production_companies?: TmdbCompany[];
  networks?: TmdbCompany[];
  created_by?: TmdbPerson[];
  origin_country?: string[];
  original_language?: string;
  credits?: {
    crew?: TmdbPerson[];
  };
};

export type TmdbGenreResponse = {
  genres?: TmdbGenre[];
};

export type MovieCatalogResult = {
  id: number;
  source: "tmdb";
  mediaType: TmdbMediaType;
  title: string;
  releaseYear: string;
  cover: string;
  backdrop?: string;
  category: string;
  meta: string;
};

export type MovieCatalogDetails = MovieCatalogResult & {
  creator: string;
  director: string;
  description: string;
  runtimeMinutes: string;
  seasonCount: string;
  episodeCount: string;
};

export type OpenLibrarySearchItem = {
  key?: string;
  title?: string;
  author_name?: string[];
  publisher?: string[];
  first_publish_year?: number;
  number_of_pages_median?: number;
  subject?: string[];
  cover_i?: number;
  edition_count?: number;
  editions?: {
    docs?: OpenLibrarySearchEdition[];
  };
};

export type OpenLibrarySearchResponse = {
  docs?: OpenLibrarySearchItem[];
};

export type OpenLibraryWork = {
  description?: string | {
    value?: string;
  };
  subjects?: string[];
};

export type OpenLibraryEdition = {
  title?: string;
  number_of_pages?: number;
  publishers?: string[];
  publish_date?: string;
  covers?: number[];
  languages?: Array<string | { key?: string }>;
  authors?: Array<{ key?: string }>;
  works?: Array<{ key?: string }>;
};

export type OpenLibrarySearchEdition = {
  key?: string;
  title?: string;
  language?: string[];
  number_of_pages?: number;
  publisher?: string[];
  publish_date?: string[];
  cover_i?: number;
  cover_edition_key?: string;
  isbn?: string[];
};

export type OpenLibraryBookApiResponse = Record<string, {
  title?: string;
  authors?: Array<{ name?: string }>;
  publishers?: Array<{ name?: string }>;
  publish_date?: string;
  number_of_pages?: number;
  cover?: {
    large?: string;
    medium?: string;
    small?: string;
  };
  subjects?: Array<{ name?: string }>;
  excerpts?: Array<{ text?: string }>;
}>;

export type OpenLibraryEditionsResponse = {
  entries?: OpenLibraryEdition[];
};

export type BookCatalogResult = {
  id: string;
  source: "open-library";
  title: string;
  releaseYear: string;
  cover: string;
  backdrop?: string;
  category: string;
  author: string;
  publisher: string;
  pageCount: string;
  searchScore?: number;
};

export type BookCatalogDetails = BookCatalogResult & {
  description: string;
};

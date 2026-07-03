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
  backdrop?: string;
  category: string;
  platform: string;
};

export type GameCatalogDetails = GameCatalogResult & {
  creator: string;
  description: string;
};
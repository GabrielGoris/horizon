import type { MediaItem, MediaStatus, MediaType } from "../../../types";

export type ExistingMediaIdentity = {
  creator: string | null;
  meta: string | null;
  media_format: "movie" | "series" | null;
  release_year: string | null;
  title: string;
};

export type MediaListSortMode =
  | "campaign_asc"
  | "campaign_desc"
  | "rating_asc"
  | "rating_desc"
  | "pages_asc"
  | "pages_desc"
  | "runtime_asc"
  | "runtime_desc"
  | "title_asc"
  | "title_desc";

export type MediaPageQuery = {
  completedYear?: string;
  gamePlatform?: string;
  mediaFormat?: "movie" | "series" | "all";
  offset?: number;
  pageSize?: number;
  searchQuery?: string;
  sortMode?: MediaListSortMode;
  status?: MediaStatus | "all";
  type: MediaType;
};

export type MediaPage = {
  hasMore: boolean;
  items: MediaItem[];
  total: number;
};

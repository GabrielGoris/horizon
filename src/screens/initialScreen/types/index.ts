import type { GamePlatformOption } from "../../../consts/gamePlatforms";
import type { MediaStatus } from "../../../types";

export interface InitialScreenProps {
  activeTab: string;
  customCategorySlug?: string;
}

export type StatusFilter = "all" | MediaStatus;
export type MediaFormatFilter = "all" | "movie" | "series";
export type GamePlatformFilter = "all" | GamePlatformOption["label"];

export type SortMode =
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

export interface LibraryFilterState {
  activeTab: string;
  completedYearFilter: string;
  gamePlatformFilter: GamePlatformFilter;
  isFiltersOpen: boolean;
  mediaFormatFilter: MediaFormatFilter;
  sortMode: SortMode;
  statusFilter: StatusFilter;
}

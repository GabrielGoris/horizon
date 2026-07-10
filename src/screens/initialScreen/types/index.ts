import type { MediaStatus } from "../../../types";

export interface InitialScreenProps {
  activeTab: string;
}

export type StatusFilter = "all" | MediaStatus;
export type MovieKindFilter = "all" | "movie" | "series";

export type SortMode =
  | "added_asc"
  | "added_desc"
  | "campaign_asc"
  | "campaign_desc"
  | "rating_asc"
  | "rating_desc"
  | "pages_asc"
  | "pages_desc"
  | "runtime_asc"
  | "runtime_desc";

export interface LibraryFilterState {
  activeTab: string;
  addedYearFilter: string;
  completedYearFilter: string;
  isFiltersOpen: boolean;
  movieKindFilter: MovieKindFilter;
  sortMode: SortMode;
  statusFilter: StatusFilter;
}

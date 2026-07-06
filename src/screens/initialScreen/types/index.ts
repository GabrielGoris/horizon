import type { MediaStatus } from "../../../types";

export interface InitialScreenProps {
  activeTab: string;
}

export type StatusFilter = "all" | MediaStatus;

export type SortMode =
  | "added_desc"
  | "campaign_asc"
  | "campaign_desc"
  | "pages_asc"
  | "pages_desc"
  | "runtime_asc"
  | "runtime_desc";

export interface LibraryFilterState {
  activeTab: string;
  addedYearFilter: string;
  completedYearFilter: string;
  isFiltersOpen: boolean;
  sortMode: SortMode;
  statusFilter: StatusFilter;
}

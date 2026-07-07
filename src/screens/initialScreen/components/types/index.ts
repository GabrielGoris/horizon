import type { MediaItem, MediaType } from "../../../../types";
import type { LibraryFilterState, MovieKindFilter, SortMode, StatusFilter } from "../../types";

export type CategorySectionProps = {
  activeLabel: string;
  activeTab: string;
  filters: {
    addedYearFilter: string;
    clearFilters: () => void;
    completedYearFilter: string;
    hasActiveFilters: boolean;
    isFiltersOpen: boolean;
    movieKindFilter: LibraryFilterState["movieKindFilter"];
    setAddedYearFilter: (value: string) => void;
    setCompletedYearFilter: (value: string) => void;
    setIsFiltersOpen: (value: boolean) => void;
    setMovieKindFilter: (value: LibraryFilterState["movieKindFilter"]) => void;
    setSortMode: (value: LibraryFilterState["sortMode"]) => void;
    setStatusFilter: (value: LibraryFilterState["statusFilter"]) => void;
    sortMode: LibraryFilterState["sortMode"];
    statusFilter: LibraryFilterState["statusFilter"];
  };
  items: MediaItem[];
  mediaType?: MediaType;
  onSelectMedia: (item: MediaItem) => void;
};

export type SortOption = {
  value: SortMode;
  label: string;
};

export interface LibraryFiltersProps {
  activeTab: string;
  mediaType?: MediaType;
  itemCount: number;
  isOpen: boolean;
  hasActiveFilters: boolean;
  statusFilter: StatusFilter;
  addedYearFilter: string;
  completedYearFilter: string;
  movieKindFilter: MovieKindFilter;
  sortMode: SortMode;
  onToggle: () => void;
  onClose: () => void;
  onStatusFilterChange: (status: StatusFilter) => void;
  onAddedYearFilterChange: (year: string) => void;
  onCompletedYearFilterChange: (year: string) => void;
  onMovieKindFilterChange: (movieKind: MovieKindFilter) => void;
  onSortModeChange: (sortMode: SortMode) => void;
  onClearFilters: () => void;
};


export interface MovieKindFiltersProps {
  movieKindFilter: MovieKindFilter;
  onChange: (movieKind: MovieKindFilter) => void;
};

export type OverviewSectionProps = {
  priorityItemsByCategory: Map<string, MediaItem[]>;
  onSelectMedia: (item: MediaItem) => void;
};


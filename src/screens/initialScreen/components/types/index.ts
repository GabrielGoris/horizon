import type { MediaItem, MediaType } from "../../../../types";
import type { GamePlatformFilter, LibraryFilterState, MovieKindFilter, SortMode, StatusFilter } from "../../types";

export type CategorySectionProps = {
  activeItems: MediaItem[];
  activeLabel: string;
  activeTab: string;
  filters: {
    clearFilters: () => void;
    completedYearFilter: string;
    gamePlatformFilter: LibraryFilterState["gamePlatformFilter"];
    hasActiveFilters: boolean;
    isFiltersOpen: boolean;
    movieKindFilter: LibraryFilterState["movieKindFilter"];
    setCompletedYearFilter: (value: string) => void;
    setGamePlatformFilter: (value: LibraryFilterState["gamePlatformFilter"]) => void;
    setIsFiltersOpen: (value: boolean) => void;
    setMovieKindFilter: (value: LibraryFilterState["movieKindFilter"]) => void;
    setSortMode: (value: LibraryFilterState["sortMode"]) => void;
    setStatusFilter: (value: LibraryFilterState["statusFilter"]) => void;
    sortMode: LibraryFilterState["sortMode"];
    statusFilter: LibraryFilterState["statusFilter"];
  };
  items: MediaItem[];
  mediaType?: MediaType;
  onPrioritizeMedia: (item: MediaItem) => void;
  onSelectMedia: (item: MediaItem) => void;
};

export type ActiveMediaSectionProps = {
  items: MediaItem[];
  mediaType?: MediaType;
  onPrioritizeMedia: (item: MediaItem) => void;
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
  completedYearFilter: string;
  gamePlatformFilter: GamePlatformFilter;
  movieKindFilter: MovieKindFilter;
  sortMode: SortMode;
  onToggle: () => void;
  onClose: () => void;
  onStatusFilterChange: (status: StatusFilter) => void;
  onCompletedYearFilterChange: (year: string) => void;
  onGamePlatformFilterChange: (platform: GamePlatformFilter) => void;
  onMovieKindFilterChange: (movieKind: MovieKindFilter) => void;
  onSortModeChange: (sortMode: SortMode) => void;
  onClearFilters: () => void;
};


export interface MovieKindFiltersProps {
  movieKindFilter: MovieKindFilter;
  onChange: (movieKind: MovieKindFilter) => void;
};

export type OverviewSectionProps = {
  onManageWishlist: (mediaType: MediaType) => void;
  onPrioritizeMedia: (item: MediaItem) => void;
  priorityItemsByCategory: Map<string, MediaItem[]>;
  onSelectMedia: (item: MediaItem) => void;
};


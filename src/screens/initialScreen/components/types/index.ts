import type { MediaItem, MediaType } from "../../../../types";
import type { GamePlatformFilter, LibraryFilterState, MediaFormatFilter, SortMode, StatusFilter } from "../../types";

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
    mediaFormatFilter: LibraryFilterState["mediaFormatFilter"];
    setCompletedYearFilter: (value: string) => void;
    setGamePlatformFilter: (value: LibraryFilterState["gamePlatformFilter"]) => void;
    setIsFiltersOpen: (value: boolean) => void;
    setMediaFormatFilter: (value: LibraryFilterState["mediaFormatFilter"]) => void;
    setSortMode: (value: LibraryFilterState["sortMode"]) => void;
    setStatusFilter: (value: LibraryFilterState["statusFilter"]) => void;
    sortMode: LibraryFilterState["sortMode"];
    statusFilter: LibraryFilterState["statusFilter"];
  };
  items: MediaItem[];
  mediaType?: MediaType;
  onPrioritizeMedia: (item: MediaItem) => void;
  onSelectMedia: (item: MediaItem) => void;
  onAddClick: () => void;
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
  mediaFormatFilter: MediaFormatFilter;
  sortMode: SortMode;
  onToggle: () => void;
  onClose: () => void;
  onStatusFilterChange: (status: StatusFilter) => void;
  onCompletedYearFilterChange: (year: string) => void;
  onGamePlatformFilterChange: (platform: GamePlatformFilter) => void;
  onMediaFormatFilterChange: (mediaFormat: MediaFormatFilter) => void;
  onSortModeChange: (sortMode: SortMode) => void;
  onClearFilters: () => void;
};


export interface MediaFormatFiltersProps {
  mediaFormatFilter: MediaFormatFilter;
  onChange: (mediaFormat: MediaFormatFilter) => void;
};

export type OverviewSectionProps = {
  onAddClick: () => void;
  onManageWishlist: (mediaType: MediaType) => void;
  onPrioritizeMedia: (item: MediaItem) => void;
  priorityItemsByCategory: Map<string, MediaItem[]>;
  onSelectMedia: (item: MediaItem) => void;
};


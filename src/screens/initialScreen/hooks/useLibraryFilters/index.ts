import { useState, type Dispatch, type SetStateAction } from "react";
import type { LibraryFilterState } from "../../types";

function getDefaultFilterState(activeTab: string): LibraryFilterState {
  return {
    activeTab,
    completedYearFilter: "",
    gamePlatformFilter: "all",
    isFiltersOpen: false,
    mediaFormatFilter: "all",
    sortMode: "title_asc",
    statusFilter: "all",
  };
}

function updateFilterState(
  activeTab: string,
  setFilterState: Dispatch<SetStateAction<LibraryFilterState>>,
  nextFilterState: Partial<Omit<LibraryFilterState, "activeTab">>
) {
  setFilterState((currentState) => {
    const baseState = currentState.activeTab === activeTab ? currentState : getDefaultFilterState(activeTab);

    return { ...baseState, ...nextFilterState };
  });
}

export function useLibraryFilters(activeTab: string) {
  const [filterState, setFilterState] = useState<LibraryFilterState>(() => getDefaultFilterState(activeTab));
  const activeFilterState = filterState.activeTab === activeTab ? filterState : getDefaultFilterState(activeTab);
  const {
    completedYearFilter,
    gamePlatformFilter,
    isFiltersOpen,
    mediaFormatFilter,
    sortMode,
    statusFilter,
  } = activeFilterState;
  const hasActiveFilters =
    statusFilter !== "all" ||
    mediaFormatFilter !== "all" ||
    gamePlatformFilter !== "all" ||
    Boolean(completedYearFilter) ||
    sortMode !== "title_asc";

  return {
    clearFilters: () => setFilterState(getDefaultFilterState(activeTab)),
    completedYearFilter,
    gamePlatformFilter,
    hasActiveFilters,
    isFiltersOpen,
    mediaFormatFilter,
    setCompletedYearFilter: (nextCompletedYearFilter: string) => updateFilterState(activeTab, setFilterState, { completedYearFilter: nextCompletedYearFilter }),
    setGamePlatformFilter: (nextGamePlatformFilter: LibraryFilterState["gamePlatformFilter"]) => updateFilterState(activeTab, setFilterState, { gamePlatformFilter: nextGamePlatformFilter }),
    setIsFiltersOpen: (nextIsFiltersOpen: boolean) => updateFilterState(activeTab, setFilterState, { isFiltersOpen: nextIsFiltersOpen }),
    setMediaFormatFilter: (nextMediaFormatFilter: "all" | "movie" | "series") => updateFilterState(activeTab, setFilterState, { mediaFormatFilter: nextMediaFormatFilter }),
    setSortMode: (nextSortMode: LibraryFilterState["sortMode"]) => updateFilterState(activeTab, setFilterState, { sortMode: nextSortMode }),
    setStatusFilter: (nextStatusFilter: LibraryFilterState["statusFilter"]) => updateFilterState(activeTab, setFilterState, { statusFilter: nextStatusFilter }),
    sortMode,
    statusFilter,
  };
}

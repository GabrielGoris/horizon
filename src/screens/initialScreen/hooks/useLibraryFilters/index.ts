import { useState, type Dispatch, type SetStateAction } from "react";
import type { LibraryFilterState } from "../../types";

function getDefaultFilterState(activeTab: string): LibraryFilterState {
  return {
    activeTab,
    addedYearFilter: "",
    completedYearFilter: "",
    isFiltersOpen: false,
    movieKindFilter: "all",
    sortMode: "added_desc",
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
    addedYearFilter,
    completedYearFilter,
    isFiltersOpen,
    movieKindFilter,
    sortMode,
    statusFilter,
  } = activeFilterState;
  const hasActiveFilters =
    statusFilter !== "all" ||
    movieKindFilter !== "all" ||
    Boolean(addedYearFilter) ||
    Boolean(completedYearFilter) ||
    sortMode !== "added_desc";

  return {
    addedYearFilter,
    clearFilters: () => setFilterState(getDefaultFilterState(activeTab)),
    completedYearFilter,
    hasActiveFilters,
    isFiltersOpen,
    movieKindFilter,
    setAddedYearFilter: (nextAddedYearFilter: string) => updateFilterState(activeTab, setFilterState, { addedYearFilter: nextAddedYearFilter }),
    setCompletedYearFilter: (nextCompletedYearFilter: string) => updateFilterState(activeTab, setFilterState, { completedYearFilter: nextCompletedYearFilter }),
    setIsFiltersOpen: (nextIsFiltersOpen: boolean) => updateFilterState(activeTab, setFilterState, { isFiltersOpen: nextIsFiltersOpen }),
    setMovieKindFilter: (nextMovieKindFilter: "all" | "movie" | "series") => updateFilterState(activeTab, setFilterState, { movieKindFilter: nextMovieKindFilter }),
    setSortMode: (nextSortMode: LibraryFilterState["sortMode"]) => updateFilterState(activeTab, setFilterState, { sortMode: nextSortMode }),
    setStatusFilter: (nextStatusFilter: LibraryFilterState["statusFilter"]) => updateFilterState(activeTab, setFilterState, { statusFilter: nextStatusFilter }),
    sortMode,
    statusFilter,
  };
}

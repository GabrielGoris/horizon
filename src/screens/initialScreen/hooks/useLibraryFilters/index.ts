import { useState, type Dispatch, type SetStateAction } from "react";
import type { LibraryFilterState } from "../../types";

const LOCKED_FILTERS_STORAGE_KEY = "horizon:locked-library-filters";

type LockedFilterPreset = Omit<LibraryFilterState, "activeTab" | "isFiltersOpen">;

function getLockedFilters() {
  if (typeof window === "undefined") return {} as Record<string, LockedFilterPreset>;

  try {
    const storedValue = window.localStorage.getItem(LOCKED_FILTERS_STORAGE_KEY);
    return storedValue ? JSON.parse(storedValue) as Record<string, LockedFilterPreset> : {};
  } catch {
    return {} as Record<string, LockedFilterPreset>;
  }
}

function getLockedFilterPreset(activeTab: string) {
  return getLockedFilters()[activeTab];
}

function saveLockedFilterPreset(activeTab: string, filterState: LibraryFilterState) {
  const lockedFilters = getLockedFilters();
  lockedFilters[activeTab] = {
    completedYearFilter: filterState.completedYearFilter,
    gamePlatformFilter: filterState.gamePlatformFilter,
    mediaFormatFilter: filterState.mediaFormatFilter,
    sortMode: filterState.sortMode,
    statusFilter: filterState.statusFilter,
  };
  window.localStorage.setItem(LOCKED_FILTERS_STORAGE_KEY, JSON.stringify(lockedFilters));
}

function removeLockedFilterPreset(activeTab: string) {
  const lockedFilters = getLockedFilters();
  delete lockedFilters[activeTab];
  window.localStorage.setItem(LOCKED_FILTERS_STORAGE_KEY, JSON.stringify(lockedFilters));
}

function getDefaultFilterState(activeTab: string): LibraryFilterState {
  const defaultPreset: LockedFilterPreset = {
    completedYearFilter: "",
    gamePlatformFilter: "all",
    mediaFormatFilter: "all",
    sortMode: "title_asc",
    statusFilter: "all",
  };

  return {
    activeTab,
    isFiltersOpen: false,
    ...(getLockedFilterPreset(activeTab) ?? defaultPreset),
  };
}

function updateFilterState(
  activeTab: string,
  setFilterState: Dispatch<SetStateAction<LibraryFilterState>>,
  nextFilterState: Partial<Omit<LibraryFilterState, "activeTab">>
) {
  setFilterState((currentState) => {
    const baseState = currentState.activeTab === activeTab ? currentState : getDefaultFilterState(activeTab);

    const nextState = { ...baseState, ...nextFilterState };
    if (getLockedFilterPreset(activeTab)) saveLockedFilterPreset(activeTab, nextState);

    return nextState;
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
  const isLocked = Boolean(getLockedFilterPreset(activeTab));
  const hasActiveFilters =
    statusFilter !== "all" ||
    mediaFormatFilter !== "all" ||
    gamePlatformFilter !== "all" ||
    Boolean(completedYearFilter) ||
    sortMode !== "title_asc";

  return {
    clearFilters: () => {
      removeLockedFilterPreset(activeTab);
      setFilterState(getDefaultFilterState(activeTab));
    },
    completedYearFilter,
    gamePlatformFilter,
    hasActiveFilters,
    isLocked,
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
    toggleLock: () => {
      if (isLocked) {
        removeLockedFilterPreset(activeTab);
        setFilterState({ ...activeFilterState });
        return;
      }

      saveLockedFilterPreset(activeTab, activeFilterState);
      setFilterState({ ...activeFilterState });
    },
  };
}

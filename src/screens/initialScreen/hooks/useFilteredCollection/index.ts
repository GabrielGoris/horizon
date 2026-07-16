import { useMemo } from "react";
import { getGamePlatformOption } from "../../../../consts/gamePlatforms";
import { getCompletionYear, isSeriesItem, sortMediaItems } from "../../utils";
import type { UseFilteredCollectionParams } from "../types";

export function useFilteredCollection({
  activeTab,
  collection,
  completedYearFilter,
  gamePlatformFilter,
  movieKindFilter,
  searchQuery,
  sortMode,
  statusFilter,
}: UseFilteredCollectionParams) {
  return useMemo(() => {
    const normalizedSearchQuery = searchQuery.toLowerCase();
    const filteredItems = collection.filter((item) => {
      const matchesTab = activeTab === "overview" || item.type === activeTab;
      const matchesSearch = item.title.toLowerCase().includes(normalizedSearchQuery);
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesMovieKind =
        activeTab !== "movies" ||
        movieKindFilter === "all" ||
        (movieKindFilter === "series" ? isSeriesItem(item) : !isSeriesItem(item));
      const matchesGamePlatform =
        activeTab !== "games" ||
        gamePlatformFilter === "all" ||
        getGamePlatformOption(item.meta)?.label === gamePlatformFilter;
      const matchesCompletedYear = !completedYearFilter || getCompletionYear(item) === completedYearFilter;

      return matchesTab && matchesSearch && matchesStatus && matchesMovieKind && matchesGamePlatform && matchesCompletedYear;
    });

    return activeTab === "overview" ? filteredItems : sortMediaItems(filteredItems, sortMode);
  }, [activeTab, collection, completedYearFilter, gamePlatformFilter, movieKindFilter, searchQuery, sortMode, statusFilter]);
}

import { useMemo } from "react";
import { getCompletionYear, getYear, isSeriesItem, sortMediaItems } from "../../utils";
import type { UseFilteredCollectionParams } from "../types";

export function useFilteredCollection({
  activeTab,
  addedYearFilter,
  collection,
  completedYearFilter,
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
      const matchesAddedYear = !addedYearFilter || getYear(item.added_at) === addedYearFilter;
      const matchesCompletedYear = !completedYearFilter || getCompletionYear(item) === completedYearFilter;

      return matchesTab && matchesSearch && matchesStatus && matchesMovieKind && matchesAddedYear && matchesCompletedYear;
    });

    return activeTab === "overview" ? filteredItems : sortMediaItems(filteredItems, sortMode);
  }, [activeTab, addedYearFilter, collection, completedYearFilter, movieKindFilter, searchQuery, sortMode, statusFilter]);
}

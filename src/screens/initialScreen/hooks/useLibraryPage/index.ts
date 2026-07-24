import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getGamePlatformOption } from "../../../../consts/gamePlatforms";
import { fetchCachedMedia, fetchMediaPage, fetchOverviewPriorityMedia } from "../../../../services/mediaService";
import { isNetworkAvailable } from "../../../../services/offlineStore";
import type { MediaItem, MediaType } from "../../../../types";
import { LIBRARY_UPDATED_EVENT } from "../../../../utils/libraryEvents";
import { getCompletionYear, isSeriesItem, sortMediaItems, sortMediaItemsByPriority } from "../../utils";
import type { LibraryFilterState } from "../../types";

const PAGE_SIZE = 30;

type LibraryPageParams = {
  activeTab: string;
  completedYearFilter: LibraryFilterState["completedYearFilter"];
  gamePlatformFilter: LibraryFilterState["gamePlatformFilter"];
  mediaFormatFilter: LibraryFilterState["mediaFormatFilter"];
  searchQuery: string;
  sortMode: LibraryFilterState["sortMode"];
  statusFilter: LibraryFilterState["statusFilter"];
};

function isMediaType(value: string): value is MediaType {
  return value === "animes" || value === "movies" || value === "games" || value === "books";
}

function filterCachedMedia(items: MediaItem[], params: LibraryPageParams) {
  const normalizedSearch = params.searchQuery.trim().toLocaleLowerCase("pt-BR");

  return sortMediaItems(items.filter((item) => {
    if (item.type !== params.activeTab) return false;
    if (normalizedSearch && !item.title.toLocaleLowerCase("pt-BR").includes(normalizedSearch)) return false;
    if (params.statusFilter !== "all" && item.status !== params.statusFilter) return false;
    const matchesFormat = params.mediaFormatFilter === "all"
      || (params.mediaFormatFilter === "series" ? isSeriesItem(item) : !isSeriesItem(item));
    if (!matchesFormat) return false;
    if (params.gamePlatformFilter !== "all" && getGamePlatformOption(item.meta)?.label !== params.gamePlatformFilter) return false;
    if (params.completedYearFilter && getCompletionYear(item) !== params.completedYearFilter) return false;

    return true;
  }), params.sortMode);
}

export function useLibraryPage(params: LibraryPageParams) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [activeItems, setActiveItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);
  const isLoadingMoreRef = useRef(false);
  const query = useMemo(() => ({
    activeTab: params.activeTab,
    completedYearFilter: params.completedYearFilter,
    gamePlatformFilter: params.gamePlatformFilter,
    mediaFormatFilter: params.mediaFormatFilter,
    searchQuery: params.searchQuery.trim(),
    sortMode: params.sortMode,
    statusFilter: params.statusFilter,
  }), [params.activeTab, params.completedYearFilter, params.gamePlatformFilter, params.mediaFormatFilter, params.searchQuery, params.sortMode, params.statusFilter]);
  const isOverview = query.activeTab === "overview";
  const isMediaLibrary = isMediaType(query.activeTab);
  const queryKey = JSON.stringify(query);

  const loadFirstPage = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError("");

    try {
      if (isOverview) {
        const overviewItems = await fetchOverviewPriorityMedia();
        if (requestId !== requestIdRef.current) return [];
        setItems(overviewItems);
        setActiveItems([]);
        setTotal(overviewItems.length);
        setHasMore(false);
        return overviewItems;
      }

      if (!isMediaLibrary) {
        if (requestId !== requestIdRef.current) return [];
        setItems([]);
        setActiveItems([]);
        setTotal(0);
        setHasMore(false);
        return [];
      }

      if (!isNetworkAvailable()) {
        const cachedItems = filterCachedMedia(await fetchCachedMedia(), query);
        if (requestId !== requestIdRef.current) return [];
        setItems(cachedItems.slice(0, PAGE_SIZE));
        setActiveItems(sortMediaItemsByPriority(cachedItems.filter((item) => item.status === "in_progress").slice(0, PAGE_SIZE)));
        setTotal(cachedItems.length);
        setHasMore(cachedItems.length > PAGE_SIZE);
        return cachedItems.slice(0, PAGE_SIZE);
      }

      const [page, activePage] = await Promise.all([
        fetchMediaPage({
          completedYear: query.completedYearFilter,
          gamePlatform: query.gamePlatformFilter,
          mediaFormat: query.mediaFormatFilter,
          pageSize: PAGE_SIZE,
          searchQuery: query.searchQuery,
          sortMode: query.sortMode,
          status: query.statusFilter,
          type: query.activeTab as MediaType,
        }),
        fetchMediaPage({
          gamePlatform: query.gamePlatformFilter,
          pageSize: PAGE_SIZE,
          searchQuery: query.searchQuery,
          sortMode: "title_asc",
          status: "in_progress",
          type: query.activeTab as MediaType,
        }),
      ]);

      if (requestId !== requestIdRef.current) return [];
      setItems(page.items);
      setActiveItems(sortMediaItemsByPriority(activePage.items));
      setTotal(page.total);
      setHasMore(page.hasMore);
      return page.items;
    } catch (loadError) {
      console.error(loadError);
      if (requestId === requestIdRef.current) {
        setError("NÃ£o foi possÃ­vel carregar a biblioteca.");
      }
      throw loadError;
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, [isMediaLibrary, isOverview, query]);

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMoreRef.current || !hasMore || !isMediaLibrary) return;

    const requestId = requestIdRef.current;
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);

    try {
      if (!isNetworkAvailable()) {
        const cachedItems = filterCachedMedia(await fetchCachedMedia(), query);
        if (requestId !== requestIdRef.current) return;

        setItems(cachedItems.slice(0, items.length + PAGE_SIZE));
        setHasMore(cachedItems.length > items.length + PAGE_SIZE);
        return;
      }

      const page = await fetchMediaPage({
        completedYear: query.completedYearFilter,
        gamePlatform: query.gamePlatformFilter,
        mediaFormat: query.mediaFormatFilter,
        offset: items.length,
        pageSize: PAGE_SIZE,
        searchQuery: query.searchQuery,
        sortMode: query.sortMode,
        status: query.statusFilter,
        type: query.activeTab as MediaType,
      });

      if (requestId !== requestIdRef.current) return;
      setItems((currentItems) => [...currentItems, ...page.items.filter((item) => !currentItems.some((current) => current.id === item.id))]);
      setHasMore(page.hasMore);
      setTotal(page.total);
    } catch (loadError) {
      console.error(loadError);
      setError("NÃ£o foi possÃ­vel carregar mais obras.");
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoading, isMediaLibrary, items.length, query]);

  useEffect(() => {
    void Promise.resolve().then(loadFirstPage).catch(() => undefined);
  }, [loadFirstPage, queryKey]);

  useEffect(() => {
    const handleLibraryUpdate = () => {
      void loadFirstPage().catch(() => undefined);
    };

    window.addEventListener(LIBRARY_UPDATED_EVENT, handleLibraryUpdate);
    return () => window.removeEventListener(LIBRARY_UPDATED_EVENT, handleLibraryUpdate);
  }, [loadFirstPage]);

  return {
    activeItems,
    error,
    hasMore,
    isLoading,
    isLoadingMore,
    items,
    loadMore,
    refresh: loadFirstPage,
    total,
  };
}

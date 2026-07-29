import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getGamePlatformOption } from "../../../../consts/gamePlatforms";
import { fetchCachedMedia, fetchMediaPage, fetchOverviewPriorityMedia } from "../../../../services/mediaService";
import type { MediaPageCursor } from "../../../../services/mediaService/types";
import { isNetworkAvailable } from "../../../../services/offlineStore";
import type { MediaItem, MediaType } from "../../../../types";
import { LIBRARY_UPDATED_EVENT } from "../../../../utils/libraryEvents";
import { getCompletionYear, isSeriesItem, sortMediaItems, sortMediaItemsByPriority } from "../../utils";
import type { LibraryFilterState } from "../../types";

const PAGE_SIZE = 30;
const INITIAL_LOAD_RETRY_DELAY_MS = 700;
const MEDIA_LIBRARY_TYPES: MediaType[] = ["animes", "movies", "games", "books"];

type CachedPage = {
  activeItems: MediaItem[];
  hasMore: boolean;
  items: MediaItem[];
  nextCursor: MediaPageCursor | null;
  total: number;
};

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

async function retryInitialLoad<T>(load: () => Promise<T>) {
  try {
    return await load();
  } catch (firstError) {
    await new Promise<void>((resolve) => window.setTimeout(resolve, INITIAL_LOAD_RETRY_DELAY_MS));

    try {
      return await load();
    } catch {
      throw firstError;
    }
  }
}

export function useLibraryPage(params: LibraryPageParams) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [activeItems, setActiveItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<MediaPageCursor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);
  const isLoadingMoreRef = useRef(false);
  const pageMemoryRef = useRef(new Map<string, CachedPage>());
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

  const loadFirstPage = useCallback(async (minimumItemCount = PAGE_SIZE) => {
    const requestId = ++requestIdRef.current;
    const itemCountToKeep = Math.max(PAGE_SIZE, minimumItemCount);
    let hasCachedItems = false;
    setIsLoading(true);
    setError("");

    try {
      if (isOverview) {
        const overviewPages = query.searchQuery
          ? await retryInitialLoad(() => Promise.all(MEDIA_LIBRARY_TYPES.map((type) => fetchMediaPage({
            pageSize: PAGE_SIZE,
            searchQuery: query.searchQuery,
            sortMode: "title_asc",
            status: "all",
            type,
          }))))
          : null;
        const overviewItems = overviewPages
          ? overviewPages.flatMap((page) => page.items)
          : await retryInitialLoad(fetchOverviewPriorityMedia);
        if (requestId !== requestIdRef.current) return [];
        setItems(overviewItems);
        setActiveItems([]);
        setTotal(overviewPages ? overviewPages.reduce((sum, page) => sum + page.total, 0) : overviewItems.length);
        setHasMore(false);
        setNextCursor(null);
        pageMemoryRef.current.set(queryKey, {
          activeItems: [],
          hasMore: false,
          items: overviewItems,
          nextCursor: null,
          total: overviewPages ? overviewPages.reduce((sum, page) => sum + page.total, 0) : overviewItems.length,
        });
        return overviewItems;
      }

      if (!isMediaLibrary) {
        if (requestId !== requestIdRef.current) return [];
        setItems([]);
        setActiveItems([]);
        setTotal(0);
        setHasMore(false);
        setNextCursor(null);
        return [];
      }

      let cachedItems: MediaItem[] = [];

      try {
        cachedItems = filterCachedMedia(await fetchCachedMedia(), query);
      } catch (cacheError) {
        console.warn("Não foi possível ler o cache local da biblioteca.", cacheError);
      }

      if (requestId !== requestIdRef.current) return [];
      if (cachedItems.length > 0) {
        hasCachedItems = true;
        const cachedPageItems = cachedItems.slice(0, itemCountToKeep);
        const cachedActiveItems = sortMediaItemsByPriority(cachedItems.filter((item) => item.status === "in_progress").slice(0, PAGE_SIZE));
        setItems(cachedPageItems);
        setActiveItems(cachedActiveItems);
        setTotal(cachedItems.length);
        setHasMore(cachedItems.length > itemCountToKeep);
        setNextCursor(null);
        pageMemoryRef.current.set(queryKey, {
          activeItems: cachedActiveItems,
          hasMore: cachedItems.length > itemCountToKeep,
          items: cachedPageItems,
          nextCursor: null,
          total: cachedItems.length,
        });
      }

      if (!isNetworkAvailable()) return cachedItems.slice(0, itemCountToKeep);

      const [page, activePage] = await retryInitialLoad(() => Promise.all([
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
      ]));

      if (requestId !== requestIdRef.current) return [];

      let loadedItems = page.items;
      let hasMorePages = page.hasMore;
      let cursor = page.nextCursor;

      while (loadedItems.length < itemCountToKeep && hasMorePages && cursor) {
        const nextPage = await fetchMediaPage({
          completedYear: query.completedYearFilter,
          cursor,
          gamePlatform: query.gamePlatformFilter,
          mediaFormat: query.mediaFormatFilter,
          pageSize: PAGE_SIZE,
          searchQuery: query.searchQuery,
          sortMode: query.sortMode,
          status: query.statusFilter,
          type: query.activeTab as MediaType,
        });

        if (requestId !== requestIdRef.current) return [];

        loadedItems = [...loadedItems, ...nextPage.items];
        hasMorePages = nextPage.hasMore;
        cursor = nextPage.nextCursor;
      }

      setItems(loadedItems);
      setActiveItems(sortMediaItemsByPriority(activePage.items));
      setTotal(page.total);
      setHasMore(hasMorePages);
      setNextCursor(cursor);
      pageMemoryRef.current.set(queryKey, {
        activeItems: sortMediaItemsByPriority(activePage.items),
        hasMore: hasMorePages,
        items: loadedItems,
        nextCursor: cursor,
        total: page.total,
      });
      return loadedItems;
    } catch (loadError) {
      console.error(loadError);
      if (requestId === requestIdRef.current && !hasCachedItems) {
        setError("Não foi possí­vel carregar a biblioteca.");
      }
      throw loadError;
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, [isMediaLibrary, isOverview, query, queryKey]);

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMoreRef.current || !hasMore || !isMediaLibrary) return;

    const requestId = requestIdRef.current;
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);

    try {
      if (!isNetworkAvailable()) {
        const cachedItems = filterCachedMedia(await fetchCachedMedia(), query);
        if (requestId !== requestIdRef.current) return;

        const nextItems = cachedItems.slice(0, items.length + PAGE_SIZE);
        const nextHasMore = cachedItems.length > nextItems.length;
        setItems(nextItems);
        setHasMore(nextHasMore);
        setNextCursor(null);
        pageMemoryRef.current.set(queryKey, {
          activeItems: pageMemoryRef.current.get(queryKey)?.activeItems ?? activeItems,
          hasMore: nextHasMore,
          items: nextItems,
          nextCursor: null,
          total: cachedItems.length,
        });
        return;
      }

      if (!nextCursor) {
        await loadFirstPage(items.length + PAGE_SIZE);
        return;
      }

      const page = await fetchMediaPage({
        completedYear: query.completedYearFilter,
        gamePlatform: query.gamePlatformFilter,
        mediaFormat: query.mediaFormatFilter,
        cursor: nextCursor ?? undefined,
        pageSize: PAGE_SIZE,
        searchQuery: query.searchQuery,
        sortMode: query.sortMode,
        status: query.statusFilter,
        type: query.activeTab as MediaType,
      });

      if (requestId !== requestIdRef.current) return;
      setItems((currentItems) => {
        const nextItems = [
          ...currentItems,
          ...page.items.filter((item) => !currentItems.some((current) => current.id === item.id)),
        ];

        pageMemoryRef.current.set(queryKey, {
          activeItems: pageMemoryRef.current.get(queryKey)?.activeItems ?? activeItems,
          hasMore: page.hasMore,
          items: nextItems,
          nextCursor: page.nextCursor,
          total: pageMemoryRef.current.get(queryKey)?.total ?? total,
        });

        return nextItems;
      });
      setHasMore(page.hasMore);
      setNextCursor(page.nextCursor);
    } catch (loadError) {
      console.error(loadError);
      setError("Não foi possível carregar mais obras.");
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [activeItems, hasMore, isLoading, isMediaLibrary, items.length, loadFirstPage, nextCursor, query, queryKey, total]);

  useLayoutEffect(() => {
    const memorizedPage = pageMemoryRef.current.get(queryKey);

    if (memorizedPage) {
      setItems(memorizedPage.items);
      setActiveItems(memorizedPage.activeItems);
      setTotal(memorizedPage.total);
      setHasMore(memorizedPage.hasMore);
      setNextCursor(memorizedPage.nextCursor);
    } else {
      setItems([]);
      setActiveItems([]);
      setTotal(0);
      setHasMore(false);
      setNextCursor(null);
    }

    void Promise.resolve().then(() => loadFirstPage()).catch(() => undefined);
  }, [loadFirstPage, queryKey]);

  const refresh = useCallback((minimumItemCount?: number) => {
    return loadFirstPage(minimumItemCount ?? items.length);
  }, [items.length, loadFirstPage]);

  useEffect(() => {
    const handleLibraryUpdate = () => {
      void refresh().catch(() => undefined);
    };

    window.addEventListener(LIBRARY_UPDATED_EVENT, handleLibraryUpdate);
    return () => window.removeEventListener(LIBRARY_UPDATED_EVENT, handleLibraryUpdate);
  }, [refresh]);

  return {
    activeItems,
    error,
    hasMore,
    isLoading,
    isLoadingMore,
    items,
    loadMore,
    refresh,
    total,
  };
}

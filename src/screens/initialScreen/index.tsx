import { lazy, Suspense, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { Header } from "../../components/Header";
import { Sidebar } from "../../components/Sidebar";
import { getWishlistItems, WISHLIST_LIMIT } from "../../services/wishlistService";
import { warmGameCatalog } from "../../services/gameCatalogService";
import { searchCustomEntries } from "../../services/customLibraryService";
import type { CustomEntry } from "../../types/customLibrary";
import { CategorySection } from "./components/CategorySection";
import { CustomCategorySection } from "./components/CustomCategorySection";
import { OverviewSection } from "./components/OverviewSection";
import { CATEGORIES } from "./consts";
import { useCustomCategories } from "./hooks/useCustomCategories";
import { useCustomLibraryWorkspace } from "./hooks/useCustomLibraryWorkspace";
import { useLibraryPage } from "./hooks/useLibraryPage";
import { useLibraryFilters } from "./hooks/useLibraryFilters";
import { useMediaCollection } from "./hooks/useMediaCollection";
import { useWishlistPriority } from "./hooks/useWishlistPriority";
import type { InitialScreenProps } from "./types";

const AddMediaDialog = lazy(() => import("../../components/AddMediaDialog").then((module) => ({ default: module.AddMediaDialog })));
const DeleteMediaDialog = lazy(() => import("../../components/DeleteMediaDialog").then((module) => ({ default: module.DeleteMediaDialog })));
const loadMediaDossier = () => import("../../components/MediaDossier").then((module) => ({ default: module.MediaDossier }));
const MediaDossier = lazy(loadMediaDossier);
const WishlistPriorityDialog = lazy(() => import("../../components/WishlistPriorityDialog").then((module) => ({ default: module.WishlistPriorityDialog })));
const CustomLibraryOverlays = lazy(() => import("./components/CustomLibraryOverlays").then((module) => ({ default: module.CustomLibraryOverlays })));
const SWIPE_MIN_DISTANCE = 84;

export function InitialScreen({ activeTab, customCategorySlug, dossierMediaId, userEmail }: InitialScreenProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [customGlobalSearch, setCustomGlobalSearch] = useState<{ entries: CustomEntry[]; query: string }>({ entries: [], query: "" });
  const [isAddMediaModalOpen, setIsAddMediaModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [slideAnimation, setSlideAnimation] = useState<"backward" | "forward" | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const slideAnimationFrameRef = useRef<number | null>(null);
  const swipeStartRef = useRef<{ target: EventTarget | null; x: number; y: number } | null>(null);
  const filters = useLibraryFilters(activeTab);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const debouncedSearchQuery = useDebouncedValue(deferredSearchQuery);
  const libraryPage = useLibraryPage({
    activeTab,
    completedYearFilter: filters.completedYearFilter,
    gamePlatformFilter: filters.gamePlatformFilter,
    mediaFormatFilter: filters.mediaFormatFilter,
    searchQuery: debouncedSearchQuery,
    sortMode: filters.sortMode,
    statusFilter: filters.statusFilter,
  });
  const mediaCollection = useMediaCollection({ skipInitialLoad: true });
  const { openMediaById } = mediaCollection;
  const { isLoadingMedia, setSelectedMedia } = mediaCollection;
  const customCategories = useCustomCategories();
  const wishlistPriority = useWishlistPriority({
    refreshMedia: libraryPage.refresh,
  });

  useEffect(() => {
    const query = debouncedSearchQuery.trim();

    if (activeTab !== "overview" || !query) return;

    let isCurrent = true;

    void Promise.all(
      customCategories.categories.map((category) => searchCustomEntries(query, category.id)),
    )
      .then((categoryEntries) => {
        if (isCurrent) setCustomGlobalSearch({ entries: categoryEntries.flat(), query });
      })
      .catch((error) => console.warn("Não foi possí­vel pesquisar nas bibliotecas personalizadas.", error));

    return () => {
      isCurrent = false;
    };
  }, [activeTab, customCategories.categories, debouncedSearchQuery]);

  useEffect(() => {
    const clearSearchTimer = window.setTimeout(() => {
      setSearchQuery((currentQuery) => currentQuery ? "" : currentQuery);
    }, 0);

    return () => window.clearTimeout(clearSearchTimer);
  }, [activeTab, customCategorySlug]);

  useEffect(() => {
    if (activeTab !== "games") return;

    const warmupTimer = window.setTimeout(() => {
      void warmGameCatalog();
    }, 1200);

    return () => window.clearTimeout(warmupTimer);
  }, [activeTab]);

  useEffect(() => {
    const preloadTimer = window.setTimeout(() => {
      void loadMediaDossier();
    }, 2_000);

    return () => window.clearTimeout(preloadTimer);
  }, []);

  const activeCategory = CATEGORIES.find((category) => category.id === activeTab);
  const customCategory = customCategories.categories.find((category) => category.slug === customCategorySlug);
  const isCustomCategoryRoute = activeTab === "custom";
  const customLibrary = useCustomLibraryWorkspace({
    category: customCategory,
    isActive: isCustomCategoryRoute,
    navigate,
    refreshCategories: customCategories.refresh,
  });

  useEffect(() => {
    if (!dossierMediaId || isLoadingMedia) return;

    const item = libraryPage.items.find((media) => media.id === dossierMediaId);
    if (item) {
      setSelectedMedia(item);
      return;
    }

    void openMediaById(dossierMediaId).catch((error) => console.error(error));
  }, [dossierMediaId, isLoadingMedia, libraryPage.items, openMediaById, setSelectedMedia]);

  useEffect(() => {
    const handleNativeBack = (event: Event) => {
      if (mediaCollection.selectedMedia) {
        event.preventDefault();
        mediaCollection.setSelectedMedia(null);
        if (dossierMediaId) navigate("/", { replace: true });
        return;
      }

      if (mediaCollection.mediaToDelete && !mediaCollection.isDeletingMedia) {
        event.preventDefault();
        mediaCollection.setMediaToDelete(null);
        return;
      }

      if (wishlistPriority.mediaToPrioritize || wishlistPriority.managedWishlistType) {
        event.preventDefault();
        wishlistPriority.cancelWishlistPriority();
        return;
      }

      if (isAddMediaModalOpen) {
        event.preventDefault();
        setIsAddMediaModalOpen(false);
        return;
      }

      if (customLibrary.selectedEntry) {
        event.preventDefault();
        customLibrary.selectEntry(null);
        return;
      }

      if (customLibrary.entryToDelete && !customLibrary.isSavingEntry) {
        event.preventDefault();
        customLibrary.cancelRemoveEntry();
        return;
      }

      if (customLibrary.isEntryDialogOpen && !customLibrary.isSavingEntry) {
        event.preventDefault();
        customLibrary.closeEntryDialog();
        return;
      }

      if (customLibrary.categoryToDelete && !customLibrary.isSavingCategory) {
        event.preventDefault();
        customLibrary.cancelRemoveCategory();
        return;
      }

      if (customLibrary.isCategoryDialogOpen && !customLibrary.isSavingCategory) {
        event.preventDefault();
        customLibrary.closeCategoryDialog();
      }
    };

    window.addEventListener("horizon:back", handleNativeBack);
    return () => window.removeEventListener("horizon:back", handleNativeBack);
  }, [customLibrary, dossierMediaId, isAddMediaModalOpen, mediaCollection, navigate, wishlistPriority]);
  const activeLabel = activeTab === "overview" ? "Visão Geral" : activeCategory?.plural ?? "Nova Categoria";
  const addMediaInitialType = activeTab === "overview" ? null : activeCategory?.id;
  const overviewPriorityItems = useMemo(() => {
    return new Map(
      CATEGORIES.map((category) => [
        category.id,
        getWishlistItems(libraryPage.items, category.id).slice(0, WISHLIST_LIMIT),
      ])
    );
  }, [libraryPage.items]);

  useLayoutEffect(() => {
    mainRef.current?.scrollTo({ behavior: "auto", top: 0 });
  }, [activeTab, customCategorySlug]);

  const runDossierUpdate = async (operation: () => Promise<unknown>) => {
    const scrollTop = mainRef.current?.scrollTop ?? 0;
    const loadedItemCount = libraryPage.items.length;

    await operation();
    await libraryPage.refresh(loadedItemCount);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        mainRef.current?.scrollTo({ behavior: "auto", top: scrollTop });
      });
    });
  };

  const handleTouchStart = (event: TouchEvent<HTMLElement>) => {
    const touch = event.touches[0];
    if (!touch || event.touches.length !== 1) return;

    swipeStartRef.current = { target: event.target, x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    const touch = event.changedTouches[0];

    if (!start || !touch || customCategorySlug || activeTab === "custom") return;
    if (start.target instanceof Element && start.target.closest("[data-horizontal-scroll]")) return;

    const horizontalDistance = touch.clientX - start.x;
    const verticalDistance = touch.clientY - start.y;

    if (Math.abs(horizontalDistance) < SWIPE_MIN_DISTANCE || Math.abs(horizontalDistance) < Math.abs(verticalDistance) * 1.4) return;

    const tabs = ["overview", ...CATEGORIES.map((category) => category.id)];
    const currentIndex = tabs.indexOf(activeTab);
    const nextIndex = currentIndex + (horizontalDistance < 0 ? 1 : -1);
    const nextTab = tabs[nextIndex];

    if (!nextTab) return;
    const direction = horizontalDistance < 0 ? "forward" : "backward";

    if (slideAnimationFrameRef.current !== null) window.cancelAnimationFrame(slideAnimationFrameRef.current);
    setSlideAnimation(null);
    slideAnimationFrameRef.current = window.requestAnimationFrame(() => {
      setSlideAnimation(direction);
      slideAnimationFrameRef.current = null;
    });

    navigate(nextTab === "overview" ? "/" : `/${nextTab}`);
  };

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-noir-base font-sans text-white">
      <Sidebar categories={CATEGORIES} customCategories={customCategories.categories} onAddCategory={customLibrary.openNewCategory} isMobileMenuOpen={isMobileMenuOpen} onMobileMenuOpenChange={setIsMobileMenuOpen} />

      <div className="relative flex h-full min-w-0 flex-1 flex-col">
        <Header
          addLabel={customCategory ? `Adicionar ${customCategory.name_singular}` : "Adicionar obra"}
          searchPlaceholder={customCategory
            ? `Buscar em ${customCategory.name_plural.toLowerCase()}...`
            : activeTab === "overview"
              ? "Buscar em todo o acervo..."
              : "Buscar obras na biblioteca..."}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddClick={() => customCategory ? customLibrary.openNewEntry() : setIsAddMediaModalOpen(true)}
          onMobileMenuClick={() => setIsMobileMenuOpen(true)}
          userEmail={userEmail}
        />

        <main
          ref={mainRef}
          className="min-h-0 flex-1 overflow-y-auto p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:p-8 sm:pb-[calc(6rem+env(safe-area-inset-bottom))] lg:p-12"
          onTouchEnd={handleTouchEnd}
          onTouchStart={handleTouchStart}
        >
          <div
            className={`mx-auto flex w-full max-w-7xl flex-col gap-8 pb-4 sm:gap-12 sm:pb-10 ${
              slideAnimation === "forward"
                ? "animate-library-swipe-forward"
                : slideAnimation === "backward"
                  ? "animate-library-swipe-backward"
                  : ""
            }`}
            onAnimationEnd={(event) => {
              if (event.target === event.currentTarget) setSlideAnimation(null);
            }}
          >
            {libraryPage.error && (
              <div
                role="alert"
                className="flex flex-col gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-4 text-sm text-red-100 sm:flex-row sm:items-center sm:justify-between"
              >
                <span>{libraryPage.error}</span>
                <button
                  type="button"
                  className="self-start rounded-lg border border-red-300/30 px-3 py-1.5 font-semibold transition hover:bg-red-400/10 disabled:opacity-50 sm:self-auto"
                  disabled={libraryPage.isLoading}
                  onClick={() => void libraryPage.refresh().catch(() => undefined)}
                >
                  {libraryPage.isLoading ? "Tentando..." : "Tentar novamente"}
                </button>
              </div>
            )}
            {isCustomCategoryRoute ? (
              customCategories.isLoading ? (
                <div className="flex min-h-80 items-center justify-center font-mono text-[10px] uppercase tracking-widest text-neutral-600">Carregando categoria</div>
              ) : customCategory ? (
                <CustomCategorySection
                  category={customCategory}
                  entries={customLibrary.entries}
                  error={customLibrary.entriesError}
                  isLoading={customLibrary.isLoadingEntries}
                  searchQuery={searchQuery}
                  onAddEntry={customLibrary.openNewEntry}
                  onEditCategory={() => customLibrary.openCategoryEditor(customCategory)}
                  onSelectEntry={customLibrary.selectEntry}
                  onRetry={() => void customLibrary.refreshEntries()}
                />
              ) : (
                <div className="flex min-h-80 flex-col items-center justify-center text-center">
                  <h2 className="font-serif text-2xl font-bold text-white">Categoria não encontrada</h2>
                  <p className="mt-2 max-w-lg text-sm text-neutral-500">{customCategories.error || "Ela pode ter sido removida ou o endereço está incorreto."}</p>
                  <button type="button" onClick={() => navigate("/")} className="mt-5 rounded-lg border border-white/10 px-4 py-2 text-xs text-neutral-300">Voltar à biblioteca</button>
                </div>
              )
            ) : activeTab === "overview" ? (
              <OverviewSection
                customCategories={customCategories.categories}
                customSearchResults={customGlobalSearch.query === debouncedSearchQuery.trim() ? customGlobalSearch.entries : []}
                isSearching={libraryPage.isLoading}
                onAddClick={() => setIsAddMediaModalOpen(true)}
                onManageWishlist={wishlistPriority.setManagedWishlistType}
                onPrioritizeMedia={wishlistPriority.setMediaToPrioritize}
                priorityItemsByCategory={overviewPriorityItems}
                searchQuery={debouncedSearchQuery}
                searchResults={libraryPage.items}
                onSelectCustomEntry={(category, entry) => {
                  customLibrary.selectEntry(entry);
                  navigate(`/c/${category.slug}`);
                }}
                onSelectMedia={mediaCollection.setSelectedMedia}
              />
            ) : (
              <CategorySection
                activeItems={libraryPage.activeItems}
                activeLabel={activeLabel}
                activeTab={activeTab}
                filters={filters}
                hasMore={libraryPage.hasMore}
                isLoadingMore={libraryPage.isLoadingMore}
                itemCount={libraryPage.total}
                items={libraryPage.items}
                mediaType={addMediaInitialType ?? undefined}
                onAddClick={() => setIsAddMediaModalOpen(true)}
                onLoadMore={() => void libraryPage.loadMore()}
                onPrioritizeMedia={wishlistPriority.setMediaToPrioritize}
                onSelectMedia={mediaCollection.setSelectedMedia}
              />
            )}
          </div>
        </main>
      </div>

      {!isCustomCategoryRoute && (
        isAddMediaModalOpen && (
          <Suspense fallback={null}>
            <AddMediaDialog
              isOpen
              onClose={() => setIsAddMediaModalOpen(false)}
              onOpenDossier={mediaCollection.setSelectedMedia}
              onSuccess={async () => {
                await libraryPage.refresh();
              }}
              onPriorityCreate={wishlistPriority.setMediaToPrioritize}
              initialType={addMediaInitialType}
            />
          </Suspense>
        )
      )}

      {(customLibrary.isCategoryDialogOpen || customLibrary.isEntryDialogOpen || customLibrary.selectedEntry || customLibrary.entryToDelete || customLibrary.categoryToDelete) && (
        <Suspense fallback={null}>
          <CustomLibraryOverlays category={customCategory} workspace={customLibrary} />
        </Suspense>
      )}

      {mediaCollection.selectedMedia && (
        <Suspense fallback={null}>
          <MediaDossier
            item={mediaCollection.selectedMedia}
            onClose={() => {
              mediaCollection.setSelectedMedia(null);
              if (dossierMediaId) navigate("/", { replace: true });
            }}
            onComplete={async (item) => {
              await runDossierUpdate(() => mediaCollection.handleCompleteMedia(item));
            }}
            onDelete={mediaCollection.setMediaToDelete}
            onDetailsChange={async (item, details) => {
              await runDossierUpdate(() => mediaCollection.handleUpdateMediaDetails(item, details));
            }}
            onMetaChange={async (item, meta) => {
              await runDossierUpdate(() => mediaCollection.handleUpdateMediaMeta(item, meta));
            }}
            onRatingChange={async (item, rating) => {
              await runDossierUpdate(() => mediaCollection.handleUpdateMediaRating(item, rating));
            }}
            onStatusChange={async (item, status) => {
              await runDossierUpdate(() => mediaCollection.handleUpdateMediaStatus(item, status));
            }}
            onSaveAudiovisualCompletion={async (item, completion) => {
              await runDossierUpdate(() => mediaCollection.handleSaveAudiovisualCompletion(item, completion));
            }}
            onSaveBookCompletion={async (item, completion) => {
              await runDossierUpdate(() => mediaCollection.handleSaveBookCompletion(item, completion));
            }}
            onSaveGameCompletion={async (item, completion) => {
              await runDossierUpdate(() => mediaCollection.handleSaveGameCompletion(item, completion));
            }}
          />
        </Suspense>
      )}

      {mediaCollection.mediaToDelete && (
        <Suspense fallback={null}>
          <DeleteMediaDialog
            item={mediaCollection.mediaToDelete}
            isDeleting={mediaCollection.isDeletingMedia}
            onCancel={() => {
              if (!mediaCollection.isDeletingMedia) {
                mediaCollection.setMediaToDelete(null);
              }
            }}
            onConfirm={async () => {
              await mediaCollection.confirmDeleteMedia();
              await libraryPage.refresh();
            }}
          />
        </Suspense>
      )}

      {wishlistPriority.mediaToPrioritize && (
        <Suspense fallback={null}>
          <WishlistPriorityDialog
            collection={wishlistPriority.wishlistDialogCollection}
            item={wishlistPriority.mediaToPrioritize}
            isSaving={wishlistPriority.isSavingWishlist}
            onCancel={wishlistPriority.cancelWishlistPriority}
            onConfirm={wishlistPriority.confirmWishlistPosition}
          />
        </Suspense>
      )}
      {wishlistPriority.managedWishlistType && !wishlistPriority.mediaToPrioritize && (
        <Suspense fallback={null}>
          <WishlistPriorityDialog
            collection={wishlistPriority.wishlistDialogCollection}
            mediaType={wishlistPriority.managedWishlistType}
            isSaving={wishlistPriority.isSavingWishlist}
            onCancel={wishlistPriority.cancelWishlistPriority}
            onMoveItem={wishlistPriority.moveWishlistItem}
            onRemoveItem={wishlistPriority.removeWishlistItem}
          />
        </Suspense>
      )}
    </div>
  );
}

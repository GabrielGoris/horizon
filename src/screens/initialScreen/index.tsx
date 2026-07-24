import { lazy, Suspense, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { Header } from "../../components/Header";
import { Sidebar } from "../../components/Sidebar";
import { getWishlistItems, WISHLIST_LIMIT } from "../../services/wishlistService";
import { warmGameCatalog } from "../../services/gameCatalogService";
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

export function InitialScreen({ activeTab, customCategorySlug, dossierMediaId, userEmail }: InitialScreenProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddMediaModalOpen, setIsAddMediaModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-noir-base font-sans text-white">
      <Sidebar categories={CATEGORIES} customCategories={customCategories.categories} onAddCategory={customLibrary.openNewCategory} isMobileMenuOpen={isMobileMenuOpen} onMobileMenuOpenChange={setIsMobileMenuOpen} />

      <div className="relative flex h-full min-w-0 flex-1 flex-col">
        <Header
          addLabel={customCategory ? `Adicionar ${customCategory.name_singular}` : "Adicionar obra"}
          searchPlaceholder={customCategory ? `Buscar em ${customCategory.name_plural.toLowerCase()}...` : "Buscar obras na biblioteca..."}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddClick={() => customCategory ? customLibrary.openNewEntry() : setIsAddMediaModalOpen(true)}
          onMobileMenuClick={() => setIsMobileMenuOpen(true)}
          userEmail={userEmail}
        />

        <main className="min-h-0 flex-1 overflow-y-auto p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:p-8 sm:pb-[calc(6rem+env(safe-area-inset-bottom))] lg:p-12">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 pb-4 sm:gap-12 sm:pb-10">
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
                onAddClick={() => setIsAddMediaModalOpen(true)}
                onManageWishlist={wishlistPriority.setManagedWishlistType}
                onPrioritizeMedia={wishlistPriority.setMediaToPrioritize}
                priorityItemsByCategory={overviewPriorityItems}
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
              await mediaCollection.handleCompleteMedia(item);
              await libraryPage.refresh();
            }}
            onDelete={mediaCollection.setMediaToDelete}
            onDetailsChange={async (item, details) => {
              await mediaCollection.handleUpdateMediaDetails(item, details);
              await libraryPage.refresh();
            }}
            onMetaChange={async (item, meta) => {
              await mediaCollection.handleUpdateMediaMeta(item, meta);
              await libraryPage.refresh();
            }}
            onRatingChange={async (item, rating) => {
              await mediaCollection.handleUpdateMediaRating(item, rating);
              await libraryPage.refresh();
            }}
            onStatusChange={async (item, status) => {
              await mediaCollection.handleUpdateMediaStatus(item, status);
              await libraryPage.refresh();
            }}
            onSaveAudiovisualCompletion={async (item, completion) => {
              await mediaCollection.handleSaveAudiovisualCompletion(item, completion);
              await libraryPage.refresh();
            }}
            onSaveBookCompletion={async (item, completion) => {
              await mediaCollection.handleSaveBookCompletion(item, completion);
              await libraryPage.refresh();
            }}
            onSaveGameCompletion={async (item, completion) => {
              await mediaCollection.handleSaveGameCompletion(item, completion);
              await libraryPage.refresh();
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

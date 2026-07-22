import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AddMediaDialog } from "../../components/AddMediaDialog";
import { DeleteMediaDialog } from "../../components/DeleteMediaDialog";
import { Header } from "../../components/Header";
import { MediaDossier } from "../../components/MediaDossier";
import { Sidebar } from "../../components/Sidebar";
import { WishlistPriorityDialog } from "../../components/WishlistPriorityDialog";
import { getGamePlatformOption } from "../../consts/gamePlatforms";
import { getWishlistItems, WISHLIST_LIMIT } from "../../services/wishlistService";
import { warmGameCatalog } from "../../services/gameCatalogService";
import { CategorySection } from "./components/CategorySection";
import { CustomCategorySection } from "./components/CustomCategorySection";
import { CustomLibraryOverlays } from "./components/CustomLibraryOverlays";
import { OverviewSection } from "./components/OverviewSection";
import { CATEGORIES } from "./consts";
import { useFilteredCollection } from "./hooks/useFilteredCollection";
import { useCustomCategories } from "./hooks/useCustomCategories";
import { useCustomLibraryWorkspace } from "./hooks/useCustomLibraryWorkspace";
import { useLibraryFilters } from "./hooks/useLibraryFilters";
import { useMediaCollection } from "./hooks/useMediaCollection";
import { useWishlistPriority } from "./hooks/useWishlistPriority";
import type { InitialScreenProps } from "./types";
import { sortMediaItemsByPriority } from "./utils";

export function InitialScreen({ activeTab, customCategorySlug, userEmail }: InitialScreenProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddMediaModalOpen, setIsAddMediaModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mediaCollection = useMediaCollection();
  const customCategories = useCustomCategories();
  const filters = useLibraryFilters(activeTab);
  const wishlistPriority = useWishlistPriority({
    collection: mediaCollection.collection,
    refreshMedia: mediaCollection.refreshMedia,
  });

  useEffect(() => {
    if (activeTab !== "games") return;

    void warmGameCatalog();
  }, [activeTab]);

  const activeCategory = CATEGORIES.find((category) => category.id === activeTab);
  const customCategory = customCategories.categories.find((category) => category.slug === customCategorySlug);
  const isCustomCategoryRoute = activeTab === "custom";
  const customLibrary = useCustomLibraryWorkspace({
    category: customCategory,
    isActive: isCustomCategoryRoute,
    navigate,
    refreshCategories: customCategories.refresh,
  });
  const activeLabel = activeTab === "overview" ? "Visão Geral" : activeCategory?.plural ?? "Nova Categoria";
  const addMediaInitialType = activeTab === "overview" ? null : activeCategory?.id;
  const filteredCollection = useFilteredCollection({
    activeTab,
    collection: mediaCollection.collection,
    completedYearFilter: filters.completedYearFilter,
    gamePlatformFilter: filters.gamePlatformFilter,
    mediaFormatFilter: filters.mediaFormatFilter,
    searchQuery,
    sortMode: filters.sortMode,
    statusFilter: filters.statusFilter,
  });
  const activeItems = useMemo(() => {
    if (activeTab === "overview") {
      return [];
    }

    const normalizedSearch = searchQuery.trim().toLowerCase();

    const itemsInProgress = mediaCollection.collection.filter((item) => {
      const matchesType = item.type === activeTab;
      const matchesStatus = item.status === "in_progress";
      const matchesSearch = !normalizedSearch || item.title.toLowerCase().includes(normalizedSearch);
      const matchesGamePlatform =
        activeTab !== "games" ||
        filters.gamePlatformFilter === "all" ||
        getGamePlatformOption(item.meta)?.label === filters.gamePlatformFilter;

      return matchesType && matchesStatus && matchesSearch && matchesGamePlatform;
    });

    return sortMediaItemsByPriority(itemsInProgress);
  }, [activeTab, filters.gamePlatformFilter, mediaCollection.collection, searchQuery]);
  const overviewPriorityItems = useMemo(() => {
    return new Map(
      CATEGORIES.map((category) => [
        category.id,
        getWishlistItems(filteredCollection, category.id).slice(0, WISHLIST_LIMIT),
      ])
    );
  }, [filteredCollection]);

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
            {mediaCollection.mediaLoadError && (
              <div
                role="alert"
                className="flex flex-col gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-4 text-sm text-red-100 sm:flex-row sm:items-center sm:justify-between"
              >
                <span>{mediaCollection.mediaLoadError}</span>
                <button
                  type="button"
                  className="self-start rounded-lg border border-red-300/30 px-3 py-1.5 font-semibold transition hover:bg-red-400/10 disabled:opacity-50 sm:self-auto"
                  disabled={mediaCollection.isLoadingMedia}
                  onClick={() => void mediaCollection.refreshMedia().catch(() => undefined)}
                >
                  {mediaCollection.isLoadingMedia ? "Tentando..." : "Tentar novamente"}
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
                activeItems={activeItems}
                activeLabel={activeLabel}
                activeTab={activeTab}
                filters={filters}
                items={filteredCollection}
                mediaType={addMediaInitialType ?? undefined}
                onAddClick={() => setIsAddMediaModalOpen(true)}
                onPrioritizeMedia={wishlistPriority.setMediaToPrioritize}
                onSelectMedia={mediaCollection.setSelectedMedia}
              />
            )}
          </div>
        </main>
      </div>

      {!isCustomCategoryRoute && (
        <AddMediaDialog
          isOpen={isAddMediaModalOpen}
          onClose={() => setIsAddMediaModalOpen(false)}
          onSuccess={async () => {
            await mediaCollection.refreshMedia();
          }}
          onPriorityCreate={wishlistPriority.setMediaToPrioritize}
          initialType={addMediaInitialType}
        />
      )}

      <CustomLibraryOverlays category={customCategory} workspace={customLibrary} />

      {mediaCollection.selectedMedia && (
        <MediaDossier
          item={mediaCollection.selectedMedia}
          onClose={() => mediaCollection.setSelectedMedia(null)}
          onComplete={mediaCollection.handleCompleteMedia}
          onDelete={mediaCollection.setMediaToDelete}
          onDetailsChange={mediaCollection.handleUpdateMediaDetails}
          onMetaChange={mediaCollection.handleUpdateMediaMeta}
          onStatusChange={mediaCollection.handleUpdateMediaStatus}
          onSaveAudiovisualCompletion={mediaCollection.handleSaveAudiovisualCompletion}
          onSaveBookCompletion={mediaCollection.handleSaveBookCompletion}
          onSaveGameCompletion={mediaCollection.handleSaveGameCompletion}
        />
      )}

      {mediaCollection.mediaToDelete && (
        <DeleteMediaDialog
          item={mediaCollection.mediaToDelete}
          isDeleting={mediaCollection.isDeletingMedia}
          onCancel={() => {
            if (!mediaCollection.isDeletingMedia) {
              mediaCollection.setMediaToDelete(null);
            }
          }}
          onConfirm={mediaCollection.confirmDeleteMedia}
        />
      )}

      {wishlistPriority.mediaToPrioritize && (
        <WishlistPriorityDialog
          collection={wishlistPriority.wishlistDialogCollection}
          item={wishlistPriority.mediaToPrioritize}
          isSaving={wishlistPriority.isSavingWishlist}
          onCancel={wishlistPriority.cancelWishlistPriority}
          onConfirm={wishlistPriority.confirmWishlistPosition}
        />
      )}
      {wishlistPriority.managedWishlistType && !wishlistPriority.mediaToPrioritize && (
        <WishlistPriorityDialog
          collection={mediaCollection.collection}
          mediaType={wishlistPriority.managedWishlistType}
          isSaving={wishlistPriority.isSavingWishlist}
          onCancel={wishlistPriority.cancelWishlistPriority}
          onMoveItem={wishlistPriority.moveWishlistItem}
          onRemoveItem={wishlistPriority.removeWishlistItem}
        />
      )}
    </div>
  );
}

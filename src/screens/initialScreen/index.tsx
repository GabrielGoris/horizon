import { useMemo, useState } from "react";
import { AddMediaDialog } from "../../components/AddMediaDialog";
import { DeleteMediaDialog } from "../../components/DeleteMediaDialog";
import { Header } from "../../components/Header";
import { MediaDossier } from "../../components/MediaDossier";
import { Sidebar } from "../../components/Sidebar";
import { WishlistPriorityDialog } from "../../components/WishlistPriorityDialog";
import { getWishlistItems } from "../../services/wishlistService";
import { CategorySection } from "./components/CategorySection";
import { OverviewSection } from "./components/OverviewSection";
import { CATEGORIES } from "./consts";
import { useFilteredCollection } from "./hooks/useFilteredCollection";
import { useLibraryFilters } from "./hooks/useLibraryFilters";
import { useMediaCollection } from "./hooks/useMediaCollection";
import { useWishlistPriority } from "./hooks/useWishlistPriority";
import type { InitialScreenProps } from "./types";

export function InitialScreen({ activeTab }: InitialScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddMediaModalOpen, setIsAddMediaModalOpen] = useState(false);
  const mediaCollection = useMediaCollection();
  const filters = useLibraryFilters(activeTab);
  const wishlistPriority = useWishlistPriority({
    collection: mediaCollection.collection,
    refreshMedia: mediaCollection.refreshMedia,
  });

  const activeCategory = CATEGORIES.find((category) => category.id === activeTab);
  const activeLabel = activeTab === "overview" ? "Visão Geral" : activeCategory?.plural ?? "Nova Categoria";
  const addMediaInitialType = activeTab === "overview" ? null : activeCategory?.id;
  const filteredCollection = useFilteredCollection({
    activeTab,
    addedYearFilter: filters.addedYearFilter,
    collection: mediaCollection.collection,
    completedYearFilter: filters.completedYearFilter,
    movieKindFilter: filters.movieKindFilter,
    searchQuery,
    sortMode: filters.sortMode,
    statusFilter: filters.statusFilter,
  });
  const activeItems = useMemo(() => {
    if (activeTab === "overview") {
      return [];
    }

    const normalizedSearch = searchQuery.trim().toLowerCase();

    return mediaCollection.collection.filter((item) => {
      const matchesType = item.type === activeTab;
      const matchesStatus = item.status === "in_progress";
      const matchesSearch = !normalizedSearch || item.title.toLowerCase().includes(normalizedSearch);

      return matchesType && matchesStatus && matchesSearch;
    });
  }, [activeTab, mediaCollection.collection, searchQuery]);
  const overviewPriorityItems = useMemo(() => {
    return new Map(
      CATEGORIES.map((category) => [
        category.id,
        getWishlistItems(filteredCollection, category.id).slice(0, 5),
      ])
    );
  }, [filteredCollection]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-noir-base font-sans text-white">
      <Sidebar categories={CATEGORIES} />

      <div className="relative flex h-screen flex-1 flex-col">
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddClick={() => setIsAddMediaModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 pb-10">
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
            {activeTab === "overview" ? (
              <OverviewSection
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
                onPrioritizeMedia={wishlistPriority.setMediaToPrioritize}
                onSelectMedia={mediaCollection.setSelectedMedia}
              />
            )}
          </div>
        </main>
      </div>

      <AddMediaDialog
        isOpen={isAddMediaModalOpen}
        onClose={() => setIsAddMediaModalOpen(false)}
        onSuccess={async () => {
          await mediaCollection.refreshMedia();
        }}
        onPriorityCreate={wishlistPriority.setMediaToPrioritize}
        initialType={addMediaInitialType}
      />

      {mediaCollection.selectedMedia && (
        <MediaDossier
          item={mediaCollection.selectedMedia}
          onClose={() => mediaCollection.setSelectedMedia(null)}
          onComplete={mediaCollection.handleCompleteMedia}
          onDelete={mediaCollection.setMediaToDelete}
          onMetaChange={mediaCollection.handleUpdateMediaMeta}
          onStatusChange={mediaCollection.handleUpdateMediaStatus}
          onSaveTicket={mediaCollection.handleSaveMovieTicket}
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

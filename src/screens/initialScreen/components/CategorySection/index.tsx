import { MediaCard } from "../../../../components/MediaCard";
import { VirtualMediaGrid } from "../../../../components/VirtualMediaGrid";
import { Plus } from "lucide-react";
import { useInfiniteList } from "../../../../hooks/useInfiniteList";
import { ActiveMediaSection } from "../ActiveMediaSection";
import { LibraryFilters } from "../LibraryFilters/index";
import type { CategorySectionProps } from "../types";

export function CategorySection({ activeItems, activeLabel, activeTab, filters, hasMore, isLoadingMore, itemCount, items, mediaType, onAddClick, onLoadMore, onPrioritizeMedia, onSelectMedia }: CategorySectionProps) {
  const { sentinelRef, visibleItems } = useInfiniteList(items, 30, { hasMore, onLoadMore });

  return (
    <>
      <ActiveMediaSection
        items={activeItems}
        mediaType={mediaType}
        onPrioritizeMedia={onPrioritizeMedia}
        onSelectMedia={onSelectMedia}
      />

      <section className="relative">
        <div className="relative mb-8 flex flex-col gap-3 border-b border-white/5 pb-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="font-serif text-2xl font-bold italic tracking-normal text-white">{activeLabel}</h3>
            <button type="button" onClick={onAddClick} aria-label={`Adicionar em ${activeLabel}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-noir-gold transition hover:bg-noir-gold/15 hover:text-noir-champagne md:hidden"><Plus size={16} /></button>
          </div>
          <LibraryFilters
            activeTab={activeTab}
            mediaType={mediaType}
            itemCount={itemCount}
            isOpen={filters.isFiltersOpen}
            hasActiveFilters={filters.hasActiveFilters}
            isLocked={filters.isLocked}
            statusFilter={filters.statusFilter}
            completedYearFilter={filters.completedYearFilter}
            gamePlatformFilter={filters.gamePlatformFilter}
            mediaFormatFilter={filters.mediaFormatFilter}
            sortMode={filters.sortMode}
            onToggle={() => filters.setIsFiltersOpen(!filters.isFiltersOpen)}
            onClose={() => filters.setIsFiltersOpen(false)}
            onStatusFilterChange={filters.setStatusFilter}
            onCompletedYearFilterChange={filters.setCompletedYearFilter}
            onGamePlatformFilterChange={filters.setGamePlatformFilter}
            onMediaFormatFilterChange={filters.setMediaFormatFilter}
            onSortModeChange={filters.setSortMode}
            onClearFilters={filters.clearFilters}
            onToggleLock={filters.toggleLock}
          />
        </div>

        <VirtualMediaGrid
          items={visibleItems}
          renderItem={(item) => (
            <MediaCard
              key={item.id}
              item={item}
              onClick={onSelectMedia}
              onPrioritize={onPrioritizeMedia}
            />
          )}
        />
        {hasMore && (
          <div ref={sentinelRef} className="flex min-h-16 items-center justify-center" aria-label="Carregar mais obras">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="rounded-lg border border-white/10 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-neutral-500 transition hover:border-noir-gold/35 hover:text-noir-champagne disabled:cursor-wait disabled:opacity-60"
            >
              {isLoadingMore ? "Carregando obras" : "Carregar mais"}
            </button>
          </div>
        )}
      </section>
    </>
  );
}

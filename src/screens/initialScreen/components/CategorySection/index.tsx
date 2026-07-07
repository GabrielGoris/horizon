import { MediaCard } from "../../../../components/MediaCard";
import { LibraryFilters } from "../LibraryFilters/index";
import type { CategorySectionProps } from "../types";

export function CategorySection({ activeLabel, activeTab, filters, items, mediaType, onSelectMedia }: CategorySectionProps) {
  return (
    <section className="relative">
      <div className="relative mb-8 flex items-center justify-between border-b border-white/5 pb-4">
        <h3 className="font-serif text-2xl font-bold italic tracking-normal text-white">
          {activeLabel}
        </h3>
        <LibraryFilters
          activeTab={activeTab}
          mediaType={mediaType}
          itemCount={items.length}
          isOpen={filters.isFiltersOpen}
          hasActiveFilters={filters.hasActiveFilters}
          statusFilter={filters.statusFilter}
          addedYearFilter={filters.addedYearFilter}
          completedYearFilter={filters.completedYearFilter}
          movieKindFilter={filters.movieKindFilter}
          sortMode={filters.sortMode}
          onToggle={() => filters.setIsFiltersOpen(!filters.isFiltersOpen)}
          onClose={() => filters.setIsFiltersOpen(false)}
          onStatusFilterChange={filters.setStatusFilter}
          onAddedYearFilterChange={filters.setAddedYearFilter}
          onCompletedYearFilterChange={filters.setCompletedYearFilter}
          onMovieKindFilterChange={filters.setMovieKindFilter}
          onSortModeChange={filters.setSortMode}
          onClearFilters={filters.clearFilters}
        />
      </div>

      <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-5">
        {items.map((item) => (
          <MediaCard
            key={item.id}
            item={item}
            onClick={onSelectMedia}
          />
        ))}
      </div>
    </section>
  );
}

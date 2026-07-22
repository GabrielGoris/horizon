import { MediaCard } from "../../../../components/MediaCard";
import { useInfiniteList } from "../../../../hooks/useInfiniteList";
import type { ActiveMediaSectionProps } from "../types";

const ACTIVE_SECTION_LABELS = {
  animes: "Assistindo",
  games: "Jogando",
  movies: "Assistindo",
  books: "Lendo",
};

export function ActiveMediaSection({ items, mediaType, onPrioritizeMedia, onSelectMedia }: ActiveMediaSectionProps) {
  const { hasMore, sentinelRef, visibleItems } = useInfiniteList(items);
  if (!items.length || !mediaType) {
    return null;
  }

  return (
    <section className="mb-12">
      <div className="mb-5 border-b border-white/5 pb-3">
        <h3 className="font-serif text-2xl font-bold italic tracking-normal text-white">
          {ACTIVE_SECTION_LABELS[mediaType]}
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:gap-6 md:grid-cols-4 lg:grid-cols-5">
        {visibleItems.map((item) => (
          <MediaCard
            key={item.id}
            item={item}
            onClick={onSelectMedia}
            onPrioritize={onPrioritizeMedia}
          />
        ))}
      </div>
      {hasMore && <div ref={sentinelRef} className="h-10" aria-label="Carregando mais obras em andamento" />}
    </section>
  );
}

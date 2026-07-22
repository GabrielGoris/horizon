import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { MediaCard } from "../../../../components/MediaCard";
import type { MediaItem } from "../../../../types";
import { CATEGORIES } from "../../consts";
import type { OverviewSectionProps } from "../types";

type PriorityCarouselProps = {
  items: MediaItem[];
  onPrioritizeMedia: (item: MediaItem) => void;
  onSelectMedia: (item: MediaItem) => void;
};

function PriorityCarousel({ items, onPrioritizeMedia, onSelectMedia }: PriorityCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateNavigation = useCallback(() => {
    const track = trackRef.current;

    if (!track) return;

    const maximumScroll = track.scrollWidth - track.clientWidth;
    setCanScrollLeft(track.scrollLeft > 1);
    setCanScrollRight(track.scrollLeft < maximumScroll - 1);
  }, []);

  useEffect(() => {
    const track = trackRef.current;

    if (!track) return;

    const resizeObserver = new ResizeObserver(updateNavigation);
    resizeObserver.observe(track);
    updateNavigation();

    return () => resizeObserver.disconnect();
  }, [items, updateNavigation]);

  const move = (direction: -1 | 1) => {
    const track = trackRef.current;
    const firstItem = track?.firstElementChild as HTMLElement | null;

    if (!track || !firstItem) return;

    const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 0;
    track.scrollBy({
      left: direction * (firstItem.offsetWidth + gap),
      behavior: "smooth",
    });
  };

  return (
    <div className="relative -mx-8 px-8 lg:-mx-12 lg:px-12">
      <button
        type="button"
        aria-label="Ver item anterior"
        disabled={!canScrollLeft}
        onClick={() => move(-1)}
        className="absolute left-1 top-1/2 z-40 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#111113]/95 text-[#ebdcb9] shadow-[0_8px_24px_rgba(0,0,0,0.65)] backdrop-blur-md transition hover:border-noir-gold/60 hover:text-noir-gold disabled:pointer-events-none disabled:opacity-0 lg:h-10 lg:w-10"
      >
        <ChevronLeft size={21} />
      </button>
      <button
        type="button"
        aria-label="Ver próximo item"
        disabled={!canScrollRight}
        onClick={() => move(1)}
        className="absolute right-1 top-1/2 z-40 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#111113]/95 text-[#ebdcb9] shadow-[0_8px_24px_rgba(0,0,0,0.65)] backdrop-blur-md transition hover:border-noir-gold/60 hover:text-noir-gold disabled:pointer-events-none disabled:opacity-0 lg:h-10 lg:w-10"
      >
        <ChevronRight size={21} />
      </button>

      <div
        ref={trackRef}
        onScroll={updateNavigation}
        className="-my-3 flex snap-x snap-mandatory gap-6 overflow-x-auto px-px py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            className="w-[calc((100%-3rem)/3)] shrink-0 snap-start md:w-[calc((100%-4.5rem)/4)] lg:w-[calc((100%-6rem)/5)]"
          >
            <MediaCard
              item={item}
              rank={index + 1}
              onClick={onSelectMedia}
              onPrioritize={onPrioritizeMedia}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function OverviewSection({ priorityItemsByCategory, onAddClick, onManageWishlist, onPrioritizeMedia, onSelectMedia }: OverviewSectionProps) {
  const hasPriorityItems = Array.from(priorityItemsByCategory.values()).some((items) => items.length > 0);

  return (
    <div className="flex flex-col gap-12">
      <div className="border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-serif text-3xl font-extrabold text-white">Visão Geral do Acervo</h2>
          <button type="button" onClick={onAddClick} aria-label="Adicionar obra" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-noir-gold transition hover:bg-noir-gold/15 hover:text-noir-champagne md:hidden"><Plus size={17} /></button>
        </div>
        <p className="mt-1 text-sm text-neutral-500">O que está no seu radar no momento.</p>
      </div>

      {!hasPriorityItems && (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
          <p>Nenhuma obra na lista de prioridade.</p>
        </div>
      )}

      {CATEGORIES.map((category) => {
        const categoryItems = priorityItemsByCategory.get(category.id) ?? [];

        if (categoryItems.length === 0) return null;

        return (
          <section key={category.id}>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-serif text-xl font-bold text-[#ebdcb9]">
                Top 10 {category.plural}
              </h3>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => onManageWishlist(category.id)}
                  className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 transition-colors hover:text-noir-gold"
                >
                  Gerenciar lista
                </button>
                <Link
                  to={`/${category.id}`}
                  className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 transition-colors hover:text-noir-gold"
                >
                  Ver Tudo
                </Link>
              </div>
            </div>

            <PriorityCarousel
              items={categoryItems}
              onPrioritizeMedia={onPrioritizeMedia}
              onSelectMedia={onSelectMedia}
            />
          </section>
        );
      })}
    </div>
  );
}

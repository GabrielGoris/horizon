import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Image, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { MediaCard } from "../../../../components/MediaCard";
import { CustomCategoryIcon } from "../../../../components/CustomCategoryIcon";
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
    setCanScrollLeft(track.scrollLeft > 8);
    setCanScrollRight(maximumScroll > 8 && track.scrollLeft < maximumScroll - 8);
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
    <div data-horizontal-scroll className="relative lg:-mx-12 lg:px-12">
      {canScrollLeft && <button
        type="button"
        aria-label="Ver item anterior"
        onClick={() => move(-1)}
        className="absolute left-1 top-1/2 z-40 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#111113] text-[#ebdcb9] shadow-[0_8px_24px_rgba(0,0,0,0.65)] transition hover:border-noir-gold/60 hover:text-noir-gold md:bg-[#111113]/95 md:backdrop-blur-md lg:h-10 lg:w-10"
      >
        <ChevronLeft size={21} />
      </button>}
      {canScrollRight && <button
        type="button"
        aria-label="Ver próximo item"
        onClick={() => move(1)}
        className="absolute right-1 top-1/2 z-40 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#111113] text-[#ebdcb9] shadow-[0_8px_24px_rgba(0,0,0,0.65)] transition hover:border-noir-gold/60 hover:text-noir-gold md:bg-[#111113]/95 md:backdrop-blur-md lg:h-10 lg:w-10"
      >
        <ChevronRight size={21} />
      </button>}

      <div
        ref={trackRef}
        onScroll={updateNavigation}
        className="-my-3 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-px py-3 sm:gap-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            className="w-[calc((100%-1.25rem)/3)] shrink-0 snap-start sm:w-[calc((100%-3rem)/3)] md:w-[calc((100%-4.5rem)/4)] lg:w-[calc((100%-6rem)/5)]"
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

export function OverviewSection({ customCategories, customSearchResults, isSearching, priorityItemsByCategory, onAddClick, onManageWishlist, onPrioritizeMedia, onSelectCustomEntry, onSelectMedia, searchQuery, searchResults }: OverviewSectionProps) {
  const hasPriorityItems = Array.from(priorityItemsByCategory.values()).some((items) => items.length > 0);
  const normalizedSearchQuery = searchQuery.trim();
  const isGlobalSearch = Boolean(normalizedSearchQuery);

  return (
    <div className="flex flex-col gap-12">
      <div className="border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-serif text-3xl font-extrabold text-white">Visão Geral do Acervo</h2>
          <button type="button" onClick={onAddClick} aria-label="Adicionar obra" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-noir-gold transition hover:bg-noir-gold/15 hover:text-noir-champagne md:hidden"><Plus size={17} /></button>
        </div>
        <p className="mt-1 text-sm text-neutral-500">O que está no seu radar no momento.</p>
      </div>

      {isGlobalSearch ? (
        <section className="flex flex-col gap-10">
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-noir-gold">Pesquisa global</span>
            <h3 className="mt-2 font-serif text-2xl font-bold text-white">Resultados para “{normalizedSearchQuery}”</h3>
          </div>

          {isSearching ? (
            <p className="py-12 text-center text-sm text-neutral-500">Buscando em todas as bibliotecas…</p>
          ) : searchResults.length === 0 && customSearchResults.length === 0 ? (
            <p className="py-12 text-center text-sm text-neutral-500">Nenhuma obra encontrada no seu acervo.</p>
          ) : <>
          {CATEGORIES.map((category) => {
            const categoryResults = searchResults.filter((item) => item.type === category.id);

            if (!categoryResults.length) return null;

            return (
              <section key={category.id}>
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h4 className="font-serif text-xl font-bold text-[#ebdcb9]">{category.plural}</h4>
                  <Link to={`/${category.id}`} className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 transition-colors hover:text-noir-gold">
                    Abrir biblioteca
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-2.5 sm:gap-6 md:grid-cols-4 lg:grid-cols-5">
                  {categoryResults.map((item) => (
                    <MediaCard key={item.id} item={item} onClick={onSelectMedia} onPrioritize={onPrioritizeMedia} />
                  ))}
                </div>
              </section>
            );
          })}
          {customCategories.map((category) => {
            const categoryResults = customSearchResults.filter((entry) => entry.category_id === category.id);

            if (!categoryResults.length) return null;

            return (
              <section key={category.id}>
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h4 className="flex items-center gap-2 font-serif text-xl font-bold" style={{ color: category.accent_color }}>
                    <CustomCategoryIcon name={category.icon} size={18} />
                    {category.name_plural}
                  </h4>
                  <Link to={`/c/${category.slug}`} className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 transition-colors hover:text-noir-gold">
                    Abrir biblioteca
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-2.5 sm:gap-6 md:grid-cols-4 lg:grid-cols-5">
                  {categoryResults.map((entry) => {
                    const cover = entry.cover_url || entry.photos[0]?.signed_url;

                    return (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => onSelectCustomEntry(category, entry)}
                        className="group relative aspect-[2/3] overflow-hidden border border-transparent bg-[#1a1a1e] text-left shadow-[0_3px_6px_rgba(0,0,0,0.55),0_8px_16px_rgba(0,0,0,0.25)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(0,0,0,0.65)]"
                      >
                        {cover ? <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-85" /> : <span className="absolute inset-0 flex items-center justify-center bg-white/[0.025] text-neutral-700"><Image size={28} /></span>}
                        <span className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
                        <span className="absolute left-3 top-3 rounded px-2 py-1 font-mono text-[8px] font-black uppercase tracking-widest text-black" style={{ backgroundColor: category.accent_color }}>
                          {entry.status === "completed" ? category.completed_label : category.planned_label}
                        </span>
                        <strong className="absolute inset-x-0 bottom-0 line-clamp-2 break-words p-4 font-serif text-base font-bold leading-tight text-white">{entry.title}</strong>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
          </>}
        </section>
      ) : (
        <>
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
            <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
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
        </>
      )}
    </div>
  );
}

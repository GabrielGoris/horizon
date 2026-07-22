import { SlidersHorizontal } from "lucide-react";
import { HorizonSelect } from "../../../../components/HorizonSelect";
import { GAME_PLATFORM_OPTIONS } from "../../../../consts/gamePlatforms";
import { getMediaStatusLabel, getMediaStatusOptions } from "../../../../consts/mediaStatus";
import type { GamePlatformFilter, SortMode } from "../../types";
import { MediaFormatFilters } from "../MediaFormatFilters/index";
import type { LibraryFiltersProps, SortOption } from "../types";

function getSortOptions(activeTab: string): SortOption[] {
  const defaultOptions: SortOption[] = [
    { value: "title_asc", label: "Título: A–Z" },
    { value: "title_desc", label: "Título: Z–A" },
    { value: "rating_desc", label: "Melhor avaliados" },
    { value: "rating_asc", label: "Pior avaliados" },
  ];

  if (activeTab === "games") {
    return [
      ...defaultOptions,
      { value: "campaign_asc", label: "Campanha menor" },
      { value: "campaign_desc", label: "Campanha maior" },
    ];
  }

  if (activeTab === "movies" || activeTab === "animes") {
    return [
      ...defaultOptions,
      { value: "runtime_asc", label: "Menor duração" },
      { value: "runtime_desc", label: "Maior duração" },
    ];
  }

  if (activeTab === "books") {
    return [
      ...defaultOptions,
      { value: "pages_asc", label: "Menos páginas" },
      { value: "pages_desc", label: "Mais páginas" },
    ];
  }

  return defaultOptions;
}

function getCompletionYearLabel(activeTab: string) {
  if (activeTab === "games") return "Ano que zerou";
  if (activeTab === "movies" || activeTab === "animes") return "Ano que assistiu";
  if (activeTab === "books") return "Ano que leu";

  return "Ano finalizado";
}

export function LibraryFilters({
  activeTab,
  mediaType,
  itemCount,
  isOpen,
  hasActiveFilters,
  statusFilter,
  completedYearFilter,
  gamePlatformFilter,
  mediaFormatFilter,
  sortMode,
  onToggle,
  onClose,
  onStatusFilterChange,
  onCompletedYearFilterChange,
  onGamePlatformFilterChange,
  onMediaFormatFilterChange,
  onSortModeChange,
  onClearFilters,
}: LibraryFiltersProps) {
  const sortOptions = getSortOptions(activeTab);
  const statusOptions = getMediaStatusOptions(
    mediaType,
    mediaFormatFilter === "all" ? undefined : mediaFormatFilter
  );
  const statusFilterOptions = [
    { value: "all", label: "Todos" },
    ...statusOptions.map((status) => ({
      value: status,
      label: getMediaStatusLabel(status, mediaType),
    })),
  ];
  const platformOptions = [
    { value: "all", label: "Todas as plataformas" },
    ...GAME_PLATFORM_OPTIONS.map((platform) => ({ value: platform.label, label: platform.label })),
  ];

  return (
    <div className="relative flex w-full items-center justify-between gap-3 md:w-auto md:justify-end">
      <span className="whitespace-nowrap rounded border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-neutral-500">
        {itemCount} itens catalogados
      </span>
      <button
        type="button"
        onClick={onToggle}
        className={`flex h-8 items-center gap-2 rounded border px-3 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors ${
          isOpen || hasActiveFilters
            ? "border-noir-gold/45 bg-noir-gold/15 text-noir-gold"
            : "border-white/10 bg-white/5 text-neutral-500 hover:border-white/20 hover:text-white"
        }`}
      >
        <SlidersHorizontal size={13} />
        Filtros
        {hasActiveFilters && (
          <span className="h-1.5 w-1.5 rounded-full bg-noir-gold" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[70]" onClick={onClose} />
          <div
            className="absolute right-0 top-[calc(100%+0.75rem)] z-[80] flex w-[min(34rem,calc(100vw-2rem))] flex-col gap-4 rounded-xl border border-white/10 bg-[#17171a] p-4 shadow-2xl shadow-black/50"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                Filtrar biblioteca
              </span>
              <button
                type="button"
                onClick={onClearFilters}
                className="font-mono text-[10px] font-bold uppercase tracking-widest text-neutral-500 transition-colors hover:text-white"
              >
                Limpar
              </button>
            </div>

            {(activeTab === "movies" || activeTab === "animes") && (
              <MediaFormatFilters
                mediaFormatFilter={mediaFormatFilter}
                onChange={onMediaFormatFilterChange}
              />
            )}

            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                Estado
              </span>
              <HorizonSelect
                ariaLabel="Filtrar por estado"
                value={statusFilter}
                options={statusFilterOptions}
                onChange={(value) => onStatusFilterChange(value as typeof statusFilter)}
              />
            </div>

            <div className={`grid grid-cols-1 gap-3 ${activeTab === "games" ? "md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.35fr)_minmax(0,0.8fr)]" : "md:grid-cols-2"}`}>
              <label className="flex min-w-0 flex-col gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Ordenar por
                <HorizonSelect
                  ariaLabel="Ordenar por"
                  value={sortMode}
                  options={sortOptions}
                  onChange={(value) => onSortModeChange(value as SortMode)}
                />
              </label>

              {activeTab === "games" && (
                <label className="flex min-w-0 flex-col gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  Plataforma
                  <HorizonSelect
                    ariaLabel="Filtrar por plataforma"
                    value={gamePlatformFilter}
                    options={platformOptions}
                    onChange={(value) => onGamePlatformFilterChange(value as GamePlatformFilter)}
                  />
                </label>
              )}

              <label className="flex min-w-0 flex-col gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                {getCompletionYearLabel(activeTab)}
                <input
                  value={completedYearFilter}
                  onChange={(event) => onCompletedYearFilterChange(event.target.value)}
                  placeholder="Ex: 2026"
                  inputMode="numeric"
                  className="w-full min-w-0 rounded-lg border border-white/10 bg-[#131315] px-3 py-2 text-sm text-white placeholder-neutral-700 outline-none transition-all focus:border-noir-gold focus:ring-1 focus:ring-noir-gold"
                />
              </label>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

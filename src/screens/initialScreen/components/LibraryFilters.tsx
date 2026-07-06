import { SlidersHorizontal } from "lucide-react";
import { MEDIA_STATUS_OPTIONS, getMediaStatusLabel } from "../../../consts/mediaStatus";
import type { MediaType } from "../../../types";
import type { MovieKindFilter, SortMode, StatusFilter } from "../types";
import { MovieKindFilters } from "./MovieKindFilters";

type SortOption = {
  value: SortMode;
  label: string;
};

interface LibraryFiltersProps {
  activeTab: string;
  mediaType?: MediaType;
  itemCount: number;
  isOpen: boolean;
  hasActiveFilters: boolean;
  statusFilter: StatusFilter;
  addedYearFilter: string;
  completedYearFilter: string;
  movieKindFilter: MovieKindFilter;
  sortMode: SortMode;
  onToggle: () => void;
  onClose: () => void;
  onStatusFilterChange: (status: StatusFilter) => void;
  onAddedYearFilterChange: (year: string) => void;
  onCompletedYearFilterChange: (year: string) => void;
  onMovieKindFilterChange: (movieKind: MovieKindFilter) => void;
  onSortModeChange: (sortMode: SortMode) => void;
  onClearFilters: () => void;
}

function getSortOptions(activeTab: string): SortOption[] {
  if (activeTab === "games") {
    return [
      { value: "added_desc", label: "Mais recentes" },
      { value: "campaign_asc", label: "Campanha menor" },
      { value: "campaign_desc", label: "Campanha maior" },
    ];
  }

  if (activeTab === "movies") {
    return [
      { value: "added_desc", label: "Mais recentes" },
      { value: "runtime_asc", label: "Menor duração" },
      { value: "runtime_desc", label: "Maior duração" },
    ];
  }

  if (activeTab === "books") {
    return [
      { value: "added_desc", label: "Mais recentes" },
      { value: "pages_asc", label: "Menos páginas" },
      { value: "pages_desc", label: "Mais páginas" },
    ];
  }

  return [{ value: "added_desc", label: "Mais recentes" }];
}

function getCompletionYearLabel(activeTab: string) {
  if (activeTab === "games") return "Ano que zerou";
  if (activeTab === "movies") return "Ano que assistiu";
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
  addedYearFilter,
  completedYearFilter,
  movieKindFilter,
  sortMode,
  onToggle,
  onClose,
  onStatusFilterChange,
  onAddedYearFilterChange,
  onCompletedYearFilterChange,
  onMovieKindFilterChange,
  onSortModeChange,
  onClearFilters,
}: LibraryFiltersProps) {
  const sortOptions = getSortOptions(activeTab);

  return (
    <div className="flex items-center gap-3">
      <span className="rounded border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-neutral-500">
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
        <div className="fixed inset-0 z-[70]" onClick={onClose}>
          <div
            className="absolute right-8 top-[156px] z-[80] flex w-[min(34rem,calc(100vw-7rem))] flex-col gap-4 rounded-xl border border-white/10 bg-[#17171a] p-4 shadow-2xl shadow-black/50 lg:right-12"
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

            {activeTab === "movies" && (
              <MovieKindFilters
                movieKindFilter={movieKindFilter}
                onChange={onMovieKindFilterChange}
              />
            )}

            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                Estado
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onStatusFilterChange("all")}
                  className={`rounded-lg border px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                    statusFilter === "all"
                      ? "border-noir-gold/50 bg-noir-gold/15 text-noir-gold"
                      : "border-white/10 bg-white/[0.03] text-neutral-500 hover:text-white"
                  }`}
                >
                  Todos
                </button>
                {MEDIA_STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onStatusFilterChange(status)}
                    className={`rounded-lg border px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                      statusFilter === status
                        ? "border-noir-gold/50 bg-noir-gold/15 text-noir-gold"
                        : "border-white/10 bg-white/[0.03] text-neutral-500 hover:text-white"
                    }`}
                  >
                    {getMediaStatusLabel(status, mediaType)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <label className="flex flex-col gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Adicionado em
                <input
                  value={addedYearFilter}
                  onChange={(event) => onAddedYearFilterChange(event.target.value)}
                  placeholder="Ex: 2026"
                  inputMode="numeric"
                  className="rounded-lg border border-white/10 bg-[#131315] px-3 py-2 text-sm text-white placeholder-neutral-700 outline-none transition-all focus:border-noir-gold focus:ring-1 focus:ring-noir-gold"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                {getCompletionYearLabel(activeTab)}
                <input
                  value={completedYearFilter}
                  onChange={(event) => onCompletedYearFilterChange(event.target.value)}
                  placeholder="Ex: 2026"
                  inputMode="numeric"
                  className="rounded-lg border border-white/10 bg-[#131315] px-3 py-2 text-sm text-white placeholder-neutral-700 outline-none transition-all focus:border-noir-gold focus:ring-1 focus:ring-noir-gold"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Ordenar por
                <select
                  value={sortMode}
                  onChange={(event) => onSortModeChange(event.target.value as SortMode)}
                  className="rounded-lg border border-white/10 bg-[#131315] px-3 py-2 text-sm text-white outline-none transition-all focus:border-noir-gold focus:ring-1 focus:ring-noir-gold"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

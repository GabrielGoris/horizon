import { SlidersHorizontal } from "lucide-react";
import type { CustomEntryStatus, CustomLibraryCategory } from "../../../../types/customLibrary";

export type CustomStatusFilter = "all" | CustomEntryStatus;
export type CustomSortMode = "title_asc" | "title_desc";

interface CustomLibraryFiltersProps {
  category: CustomLibraryCategory;
  hasActiveFilters: boolean;
  isOpen: boolean;
  itemCount: number;
  sortMode: CustomSortMode;
  statusFilter: CustomStatusFilter;
  onClear: () => void;
  onClose: () => void;
  onSortChange: (sortMode: CustomSortMode) => void;
  onStatusChange: (status: CustomStatusFilter) => void;
  onToggle: () => void;
}

export function CustomLibraryFilters({
  category,
  hasActiveFilters,
  isOpen,
  itemCount,
  sortMode,
  statusFilter,
  onClear,
  onClose,
  onSortChange,
  onStatusChange,
  onToggle,
}: CustomLibraryFiltersProps) {
  const statusOptions: Array<{ label: string; value: CustomStatusFilter }> = [
    { value: "all", label: "Todos" },
    { value: "planned", label: category.planned_label },
    { value: "completed", label: category.completed_label },
  ];

  return (
    <div className="relative flex items-center gap-3">
      <span className="rounded border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-neutral-500">
        {itemCount} itens catalogados
      </span>
      <button
        type="button"
        onClick={onToggle}
        className={`flex h-8 items-center gap-2 rounded border px-3 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors ${isOpen || hasActiveFilters ? "border-noir-gold/45 bg-noir-gold/15 text-noir-gold" : "border-white/10 bg-white/5 text-neutral-500 hover:border-white/20 hover:text-white"}`}
      >
        <SlidersHorizontal size={13} />
        Filtros
        {hasActiveFilters && <span className="h-1.5 w-1.5 rounded-full bg-noir-gold" />}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[70]" onClick={onClose} />
          <div className="absolute right-0 top-[calc(100%+0.75rem)] z-[80] flex w-[min(28rem,calc(100vw-2rem))] flex-col gap-5 rounded-xl border border-white/10 bg-[#17171a] p-4 shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-neutral-500">Filtrar biblioteca</span>
              <button type="button" onClick={onClear} className="font-mono text-[10px] font-bold uppercase tracking-widest text-neutral-500 transition-colors hover:text-white">Limpar</button>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-neutral-500">Estado</span>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onStatusChange(option.value)}
                    className={`rounded-lg border px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${statusFilter === option.value ? "border-noir-gold/50 bg-noir-gold/15 text-noir-gold" : "border-white/10 bg-white/[0.03] text-neutral-500 hover:text-white"}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex min-w-0 flex-col gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Ordenar por
              <select value={sortMode} onChange={(event) => onSortChange(event.target.value as CustomSortMode)} className="w-full min-w-0 rounded-lg border border-white/10 bg-[#131315] py-2 pl-3 pr-9 text-sm text-white outline-none transition-all focus:border-noir-gold focus:ring-1 focus:ring-noir-gold">
                <option value="title_asc">Título: A–Z</option>
                <option value="title_desc">Título: Z–A</option>
              </select>
            </label>
          </div>
        </>
      )}
    </div>
  );
}

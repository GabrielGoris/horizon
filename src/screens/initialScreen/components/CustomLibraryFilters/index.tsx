import { SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FieldFilters } from "./FieldFilters";
import type { CustomFieldFilters, CustomSortMode } from "../../../../utils/customLibrary/filters";
export type { CustomSortMode } from "../../../../utils/customLibrary/filters";
import { HorizonSelect } from "../../../../components/HorizonSelect";
import type { CustomEntryStatus, CustomLibraryCategory } from "../../../../types/customLibrary";

export type CustomStatusFilter = "all" | CustomEntryStatus;

interface CustomLibraryFiltersProps {
  fieldFilters: CustomFieldFilters;
  onFieldFiltersChange: (filters: CustomFieldFilters) => void;
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
  fieldFilters,
  onFieldFiltersChange,
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
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== "undefined" && (window.visualViewport?.width ?? window.innerWidth) < 640
  );
  const statusOptions: Array<{ label: string; value: CustomStatusFilter }> = [
    { value: "all", label: "Todos" },
    { value: "planned", label: category.planned_label },
    { value: "completed", label: category.completed_label },
  ];

  useEffect(() => {
    const updateViewport = () => {
      setIsMobileViewport((window.visualViewport?.width ?? window.innerWidth) < 640);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    window.visualViewport?.addEventListener("resize", updateViewport);
    return () => {
      window.removeEventListener("resize", updateViewport);
      window.visualViewport?.removeEventListener("resize", updateViewport);
    };
  }, []);

  const filterContent = <>
    <div className="flex items-center justify-between">
      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-neutral-500">Filtrar biblioteca</span>
      <button type="button" onClick={onClear} className="font-mono text-[10px] font-bold uppercase tracking-widest text-neutral-500 transition-colors hover:text-white">Limpar</button>
    </div>

    <div className="flex flex-col gap-2">
      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-neutral-500">Estado</span>
      <HorizonSelect
        ariaLabel="Filtrar por estado"
        value={statusFilter}
        options={statusOptions}
        onChange={(value) => onStatusChange(value as CustomStatusFilter)}
      />
    </div>

    <label className="flex min-w-0 flex-col gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
      Ordenar por
      <HorizonSelect
        ariaLabel="Ordenar por"
        value={sortMode}
        options={[
          { value: "title_asc", label: "Título: A–Z" },
          { value: "title_desc", label: "Título: Z–A" },
          { value: "created_desc", label: "Adicionados por último" },
          { value: "created_asc", label: "Adicionados há mais tempo" },
          { value: "updated_desc", label: "Atualizados recentemente" },
        ]}
        onChange={(value) => onSortChange(value as CustomSortMode)}
      />
    </label>
    <FieldFilters category={category} filters={fieldFilters} onChange={onFieldFiltersChange} />
  </>;

  const mobileFilters = isOpen && isMobileViewport && typeof document !== "undefined"
    ? createPortal(
      <>
        <div className="fixed inset-0 z-[70]" onClick={onClose} />
        <div className="fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[80] flex max-h-[calc(100dvh-8rem)] flex-col gap-5 overflow-x-hidden overflow-y-auto overscroll-contain rounded-xl border border-white/10 bg-[#17171a] p-4 shadow-2xl shadow-black/50">
          {filterContent}
        </div>
      </>,
      document.body
    )
    : null;

  return (
    <div className="relative flex w-full shrink-0 basis-full items-center justify-between gap-3 sm:w-auto sm:basis-auto sm:justify-end">
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

      {mobileFilters}
      {isOpen && !isMobileViewport && (
        <>
          <div className="fixed inset-0 z-[70]" onClick={onClose} />
          <div className="absolute right-0 top-[calc(100%+0.75rem)] z-[80] flex max-h-[65vh] w-[min(28rem,calc(100vw-2rem))] max-w-full flex-col gap-5 overflow-x-hidden overflow-y-auto overscroll-contain rounded-xl border border-white/10 bg-[#17171a] p-4 shadow-2xl shadow-black/50">
            {filterContent}
          </div>
        </>
      )}
    </div>
  );
}

import { Image, Pencil, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { CustomCategoryIcon } from "../../../../components/CustomCategoryIcon";
import { useInfiniteList } from "../../../../hooks/useInfiniteList";
import type { CustomEntry, CustomLibraryCategory } from "../../../../types/customLibrary";
import { formatCustomFieldValue } from "../../../../utils/customLibrary";
import { CustomLibraryFilters, type CustomSortMode, type CustomStatusFilter } from "../CustomLibraryFilters";

interface CustomCategorySectionProps {
  category: CustomLibraryCategory;
  entries: CustomEntry[];
  error: string;
  isLoading: boolean;
  searchQuery: string;
  onEditCategory: () => void;
  onAddEntry: () => void;
  onSelectEntry: (entry: CustomEntry) => void;
  onRetry: () => void;
}

export function CustomCategorySection({
  category,
  entries,
  error,
  isLoading,
  searchQuery,
  onEditCategory,
  onAddEntry,
  onSelectEntry,
  onRetry,
}: CustomCategorySectionProps) {
  const [statusFilter, setStatusFilter] = useState<CustomStatusFilter>("all");
  const [sortMode, setSortMode] = useState<CustomSortMode>("title_asc");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const filteredEntries = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("pt-BR");

    return entries.filter((entry) => {
      const matchesStatus = statusFilter === "all" || entry.status === statusFilter;
      const matchesSearch = !query
        || entry.title.toLocaleLowerCase("pt-BR").includes(query)
        || entry.description.toLocaleLowerCase("pt-BR").includes(query);

      return matchesStatus && matchesSearch;
    }).sort((left, right) => {
      const comparison = left.title.localeCompare(right.title, "pt-BR", { sensitivity: "base" });
      return sortMode === "title_asc" ? comparison : -comparison;
    });
  }, [entries, searchQuery, sortMode, statusFilter]);
  const hasActiveFilters = statusFilter !== "all" || sortMode !== "title_asc";
  const { hasMore, sentinelRef, visibleItems } = useInfiniteList(filteredEntries);

  return (
    <section>
      <header className="mb-7 flex flex-col gap-5 border-b border-white/5 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04]" style={{ color: category.accent_color }}>
              <CustomCategoryIcon name={category.icon} size={19} />
            </span>
            <h2 className="font-serif text-3xl font-extrabold text-white">{category.name_plural}</h2>
          </div>
          {category.description && <p className="max-w-2xl text-sm leading-6 text-neutral-500">{category.description}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-3 self-start">
          <button type="button" onClick={onAddEntry} aria-label={`Adicionar em ${category.name_plural}`} className="flex h-8 w-8 items-center justify-center rounded-md bg-white/[0.04] text-noir-gold transition hover:bg-noir-gold/15 hover:text-noir-champagne md:hidden"><Plus size={16} /></button>
          <button type="button" onClick={onEditCategory} className="flex h-8 items-center gap-2 rounded border border-white/10 bg-white/5 px-3 font-mono text-[10px] font-bold uppercase tracking-widest text-neutral-500 transition-colors hover:border-white/20 hover:text-white">
            <Pencil size={13} /> Configurar
          </button>
          <CustomLibraryFilters
            category={category}
            hasActiveFilters={hasActiveFilters}
            isOpen={isFiltersOpen}
            itemCount={filteredEntries.length}
            sortMode={sortMode}
            statusFilter={statusFilter}
            onClear={() => {
              setStatusFilter("all");
              setSortMode("title_asc");
            }}
            onClose={() => setIsFiltersOpen(false)}
            onSortChange={setSortMode}
            onStatusChange={setStatusFilter}
            onToggle={() => setIsFiltersOpen((current) => !current)}
          />
        </div>
      </header>

      {error && (
        <div role="alert" className="mb-6 flex items-center justify-between rounded-xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          <span>{error}</span>
          <button type="button" onClick={onRetry} className="font-bold underline">Tentar novamente</button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-3 gap-2.5 sm:gap-6 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => <div key={index} className="aspect-[2/3] animate-pulse bg-white/[0.04]" />)}
        </div>
      ) : filteredEntries.length > 0 ? (
        <div className="grid grid-cols-3 gap-2.5 sm:gap-6 md:grid-cols-4 lg:grid-cols-5">
          {visibleItems.map((entry) => {
            const previewFields = category.fields
              .map((field) => ({ field, value: formatCustomFieldValue(field, entry.values[field.id]) }))
              .filter((item) => item.value)
              .slice(0, 2);
            const cover = entry.cover_url || entry.photos[0]?.signed_url;

            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => onSelectEntry(entry)}
                className="group relative aspect-[2/3] overflow-hidden border border-transparent bg-[#1a1a1e] text-left shadow-[0_3px_6px_rgba(0,0,0,0.55),0_8px_16px_rgba(0,0,0,0.25)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(0,0,0,0.65)]"
              >
                {cover ? (
                  <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-85" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center bg-white/[0.025] text-neutral-700"><Image size={28} /></span>
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
                <span className="absolute left-3 top-3 rounded px-2 py-1 font-mono text-[8px] font-black uppercase tracking-widest text-black" style={{ backgroundColor: category.accent_color }}>
                  {entry.status === "completed" ? category.completed_label : category.planned_label}
                </span>
                <span className="absolute inset-x-0 bottom-0 p-4">
                  <strong className="block font-serif text-lg font-bold leading-tight text-white">{entry.title}</strong>
                  {previewFields.map(({ field, value }) => (
                    <span key={field.id} className="mt-1 block truncate text-[10px] text-neutral-400">
                      <span className="text-neutral-600">{field.label}: </span>{value}
                    </span>
                  ))}
                  {entry.photos.length > 1 && <span className="mt-2 flex items-center gap-1 font-mono text-[9px] text-neutral-500"><Image size={11} /> {entry.photos.length} fotos</span>}
                </span>
              </button>
            );
          })}
          {hasMore && <div ref={sentinelRef} className="h-10" aria-label="Carregando mais itens" />}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-600">
          <p className="text-sm">Nenhum item nesta categoria.</p>
        </div>
      )}
    </section>
  );
}

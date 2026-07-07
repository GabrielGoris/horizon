import type { MovieKindFilter } from "../../types";
import type { MovieKindFiltersProps } from "../types";

const movieKindOptions: Array<{ label: string; value: MovieKindFilter }> = [
  { label: "Todos", value: "all" },
  { label: "Filmes", value: "movie" },
  { label: "Séries", value: "series" },
];

export function MovieKindFilters({ movieKindFilter, onChange }: MovieKindFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="w-full font-mono text-[10px] font-bold uppercase tracking-widest text-neutral-500">
        Tipo
      </span>
      {movieKindOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-lg border px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${
            movieKindFilter === option.value
              ? "border-noir-gold/50 bg-noir-gold/15 text-noir-gold"
              : "border-white/10 bg-white/[0.03] text-neutral-500 hover:text-white"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

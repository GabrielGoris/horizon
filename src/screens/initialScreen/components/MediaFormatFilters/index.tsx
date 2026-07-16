import type { MediaFormatFilter } from "../../types";
import type { MediaFormatFiltersProps } from "../types";

const mediaFormatOptions: Array<{ label: string; value: MediaFormatFilter }> = [
  { label: "Todos", value: "all" },
  { label: "Filmes", value: "movie" },
  { label: "Séries", value: "series" },
];

export function MediaFormatFilters({ mediaFormatFilter, onChange }: MediaFormatFiltersProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-neutral-500">
        Formato
      </span>
      <div className="flex flex-wrap gap-2">
        {mediaFormatOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-lg border px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${
              mediaFormatFilter === option.value
                ? "border-noir-gold/50 bg-noir-gold/15 text-noir-gold"
                : "border-white/10 bg-white/[0.03] text-neutral-500 hover:text-white"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

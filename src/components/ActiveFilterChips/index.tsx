import { X } from "lucide-react";

export function ActiveFilterChips({ chips, onClear }: { chips: { id: string; label: string; remove: () => void }[]; onClear: () => void }) {
  if (!chips.length) return null;
  return <div aria-label="Filtros ativos" className="mb-5 flex flex-wrap items-center gap-2">
    {chips.map((chip) => <button key={chip.id} type="button" aria-label={`Remover filtro: ${chip.label}`} onClick={chip.remove} className="flex max-w-full items-center gap-2 rounded-full border border-noir-gold/25 bg-noir-gold/10 px-3 py-1.5 text-xs text-noir-champagne"><span className="truncate">{chip.label}</span><X size={13} className="shrink-0" /></button>)}
    <button type="button" onClick={onClear} className="px-2 py-1 text-xs text-neutral-400 hover:text-white">Limpar tudo</button>
  </div>;
}

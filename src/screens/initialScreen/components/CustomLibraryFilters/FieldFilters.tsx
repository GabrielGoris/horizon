import type { CustomLibraryCategory } from "../../../../types/customLibrary";
import type { CustomFieldFilters, FieldFilter } from "../../../../utils/customLibrary/filters";

const inputClass = "min-w-0 w-full rounded-lg border border-white/10 bg-[#131315] px-3 py-2 text-sm text-white outline-none focus:border-noir-gold";
const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export function FieldFilters({ category, filters, onChange }: {
  category: CustomLibraryCategory;
  filters: CustomFieldFilters;
  onChange: (filters: CustomFieldFilters) => void;
}) {
  const fields = [{ id: "completed_at", label: "Data de conclusão", field_type: "date", options: [] }, ...category.fields.filter((field) => ["date", "number", "currency", "boolean", "multiselect"].includes(field.field_type))];
  return fields.map((field) => {
    const filter = filters[field.id] ?? {};
    const update = (patch: Partial<FieldFilter>) => onChange({ ...filters, [field.id]: { ...filter, ...patch } });
    return <fieldset key={field.id} className="flex min-w-0 flex-col gap-2 border-t border-white/10 pt-3">
      <legend className="px-1 text-xs font-bold text-neutral-400">{field.label}</legend>
      {field.field_type === "date" && <>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-neutral-500">Mês<select aria-label={`Mês: ${field.label}`} className={inputClass} value={filter.month ?? ""} onChange={(event) => update({ month: event.target.value, date: "" })}><option value="">Todos os meses</option>{months.map((month, index) => <option key={month} value={String(index + 1).padStart(2, "0")}>{month}</option>)}</select></label>
          <label className="text-xs text-neutral-500">Ano<input aria-label={`Ano: ${field.label}`} className={inputClass} inputMode="numeric" maxLength={4} placeholder="Ex.: 2026" value={filter.year ?? ""} onChange={(event) => update({ year: event.target.value.replace(/\D/g, ""), date: "" })} /></label>
        </div>
        <label className="text-xs text-neutral-500">Data específica<input aria-label={`Data específica: ${field.label}`} type="date" className={inputClass} value={filter.date ?? ""} onChange={(event) => update({ date: event.target.value, month: "", year: "" })} /></label>
      </>}
      {(field.field_type === "number" || field.field_type === "currency") && <div className="grid grid-cols-2 gap-2">{(["min", "max"] as const).map((bound) => <label key={bound} className="text-xs text-neutral-500">{bound === "min" ? "Mínimo" : "Máximo"}{field.field_type === "currency" ? " (R$)" : ""}<input aria-label={`${bound === "min" ? "Mínimo" : "Máximo"}: ${field.label}`} type="number" step="any" className={inputClass} value={filter[bound] ?? ""} onChange={(event) => update({ [bound]: event.target.value })} /></label>)}</div>}
      {field.field_type === "boolean" && <select aria-label={field.label} className={inputClass} value={filter.boolean ?? ""} onChange={(event) => update({ boolean: event.target.value })}><option value="">Todos</option><option value="true">Sim</option><option value="false">Não</option></select>}
      {field.field_type === "multiselect" && <><p className="text-xs text-neutral-500">Corresponde a qualquer uma das opções selecionadas.</p><div className="flex flex-wrap gap-3">{field.options.map((option) => <label key={option} className="flex items-center gap-2 text-sm text-neutral-300"><input type="checkbox" className="accent-[#d4af37]" checked={filter.options?.includes(option) ?? false} onChange={(event) => update({ options: event.target.checked ? [...(filter.options ?? []), option] : filter.options?.filter((value) => value !== option) })} />{option}</label>)}</div></>}
    </fieldset>;
  });
}

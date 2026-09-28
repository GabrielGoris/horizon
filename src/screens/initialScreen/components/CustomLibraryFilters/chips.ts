import type { CustomEntryStatus, CustomLibraryCategory } from "../../../../types/customLibrary";
import type { CustomFieldFilters, CustomSortMode, FieldFilter } from "../../../../utils/customLibrary/filters";

type CustomStatusFilter = "all" | CustomEntryStatus;

const SORT_LABELS: Record<Exclude<CustomSortMode, "title_asc">, string> = {
  title_desc: "Título: Z–A",
  created_desc: "Adicionados por último",
  created_asc: "Adicionados há mais tempo",
  updated_desc: "Atualizados recentemente",
};

export function getCustomFilterFields(category: CustomLibraryCategory) {
  return category.fields.filter((field) => ["date", "number", "currency", "boolean", "multiselect"].includes(field.field_type));
}

export interface CustomFilterChipDescriptor {
  fieldId?: string;
  filterKey?: keyof FieldFilter;
  id: string;
  label: string;
  type: "status" | "sort" | "field";
}

export function getCustomFilterChips(
  category: CustomLibraryCategory,
  status: CustomStatusFilter,
  sortMode: CustomSortMode,
  filters: CustomFieldFilters,
) {
  const chips: CustomFilterChipDescriptor[] = [];
  if (status !== "all") chips.push({ id: "status", type: "status", label: status === "planned" ? category.planned_label : category.completed_label });
  if (sortMode !== "title_asc") chips.push({ id: "sort", type: "sort", label: SORT_LABELS[sortMode] });

  for (const [fieldId, filter] of Object.entries(filters)) {
    const field = category.fields.find((item) => item.id === fieldId);
    const fieldLabel = fieldId === "completed_at" ? "Data de conclusão" : field?.label;
    if (!fieldLabel) continue;
    for (const [rawKey, value] of Object.entries(filter)) {
      const filterKey = rawKey as keyof FieldFilter;
      if (!value || (Array.isArray(value) && !value.length)) continue;
      const displayValue = filterKey === "month"
        ? new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date(2020, Number(value) - 1, 1))
        : filterKey === "boolean"
          ? value === "true" ? "Sim" : "Não"
          : filterKey === "date"
            ? String(value).split("-").reverse().join("/")
            : Array.isArray(value) ? value.join(", ") : String(value);
      const bound = filterKey === "min" ? "mín. " : filterKey === "max" ? "máx. " : "";
      const currency = field?.field_type === "currency" ? "R$ " : "";
      chips.push({ id: `${fieldId}-${filterKey}`, type: "field", fieldId, filterKey, label: `${fieldLabel}: ${bound}${currency}${displayValue}` });
    }
  }
  return chips;
}

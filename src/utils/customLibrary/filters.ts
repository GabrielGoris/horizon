import type { CustomEntry, CustomLibraryCategory } from "../../types/customLibrary.ts";

export interface FieldFilter {
  year?: string;
  month?: string;
  date?: string;
  min?: string;
  max?: string;
  boolean?: string;
  options?: string[];
}
export type CustomFieldFilters = Record<string, FieldFilter>;
export type CustomSortMode = "title_asc" | "title_desc" | "created_desc" | "created_asc" | "updated_desc";

export function isFieldFilterActive(filter: FieldFilter) {
  return Object.values(filter).some((value) => Array.isArray(value) ? value.length > 0 : Boolean(value));
}

export function matchesFieldFilter(value: unknown, filter: FieldFilter) {
  if (!isFieldFilterActive(filter)) return true;
  if (value === null || value === undefined || value === "") return false;
  if (filter.year || filter.month || filter.date) {
    const text = String(value).trim();
    const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
    const iso = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?(?:T.*)?$/.exec(text);
    const parts = br ? [br[3], br[2], br[1]] : iso ? [iso[1], iso[2], iso[3]] : null;
    if (!parts) return false;
    if (filter.year && parts[0] !== filter.year) return false;
    if (filter.month && parts[1] !== filter.month) return false;
    if (filter.date && parts.join("-") !== filter.date) return false;
  }
  if (filter.min || filter.max) {
    if (typeof value !== "number" && typeof value !== "string") return false;
    if (typeof value === "string" && !value.trim()) return false;
    const number = Number(value);
    if (!Number.isFinite(number)) return false;
    if (filter.min && number < Number(filter.min)) return false;
    if (filter.max && number > Number(filter.max)) return false;
  }
  if (filter.boolean && value !== (filter.boolean === "true")) return false;
  if (filter.options?.length && (!Array.isArray(value) || !filter.options.some((option) => value.includes(option)))) return false;
  return true;
}

export function matchesCustomFilters(entry: CustomEntry, category: CustomLibraryCategory, filters: CustomFieldFilters) {
  return matchesFieldFilter(entry.completed_at, filters.completed_at ?? {})
    && category.fields.every((field) => matchesFieldFilter(entry.values[field.id], filters[field.id] ?? {}));
}

export function compareCustomEntries(left: CustomEntry, right: CustomEntry, mode: CustomSortMode) {
  const title = left.title.localeCompare(right.title, "pt-BR", { sensitivity: "base" });
  if (mode === "title_asc") return title;
  if (mode === "title_desc") return -title;
  const key = mode === "updated_desc" ? "updated_at" : "created_at";
  const a = Date.parse(left[key] ?? "");
  const b = Date.parse(right[key] ?? "");
  if (!Number.isFinite(a)) return Number.isFinite(b) ? 1 : title;
  if (!Number.isFinite(b)) return -1;
  return (mode === "created_asc" ? a - b : b - a) || title;
}

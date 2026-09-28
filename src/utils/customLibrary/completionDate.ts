import type { CustomFieldValue, CustomLibraryCategory } from "../../types/customLibrary";
import { toSupabaseDate } from "../date/index.ts";

export function getCompletionDateField(category: CustomLibraryCategory) {
  return category.fields.find((field) => field.phase === "completion" && field.field_type === "date");
}

export function getCompletionDateValue(
  category: CustomLibraryCategory,
  values: Record<string, CustomFieldValue>,
  fallback = "",
) {
  const field = getCompletionDateField(category);
  const value = field ? values[field.id] : undefined;
  return typeof value === "string" && toSupabaseDate(value) ? value : fallback;
}

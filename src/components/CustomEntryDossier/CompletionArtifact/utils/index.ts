export function formatCompletedDate(value?: string) {
  if (!value) return "";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(date);
}

export function toCompletionDateInput(value?: string) {
  return value ? getDateInputValue(value) : "";
}
import { getDateInputValue } from "../../../../utils/date";

import type { CustomCategoryField, CustomFieldValue } from "../../types/customLibrary";

export function formatCustomFieldValue(field: CustomCategoryField, value: CustomFieldValue) {
  if (value === null || value === "" || (Array.isArray(value) && value.length === 0)) return "";
  if (field.field_type === "boolean") return value ? "Sim" : "Não";
  if (field.field_type === "currency") {
    const numberValue = Number(value);
    return Number.isFinite(numberValue)
      ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(numberValue)
      : String(value);
  }
  if (field.field_type === "date" && typeof value === "string") {
    const [year, month, day] = value.split("-").map(Number);
    return year && month && day ? new Intl.DateTimeFormat("pt-BR").format(new Date(year, month - 1, day)) : value;
  }
  if (Array.isArray(value)) return value.join(", ");

  return String(value);
}

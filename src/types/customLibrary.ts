export type CustomFieldType =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "date"
  | "url"
  | "boolean"
  | "select"
  | "multiselect";

export type CustomFieldPhase = "planning" | "completion";
export type CustomEntryStatus = "planned" | "completed";
export type CustomFieldValue = string | number | boolean | string[] | null;

export interface CustomCategoryField {
  id: string;
  category_id: string;
  user_id?: string;
  label: string;
  field_type: CustomFieldType;
  phase: CustomFieldPhase;
  required: boolean;
  options: string[];
  position: number;
}

export interface CustomLibraryCategory {
  id: string;
  user_id?: string;
  slug: string;
  name_singular: string;
  name_plural: string;
  description: string;
  icon: string;
  accent_color: string;
  planned_label: string;
  completed_label: string;
  position: number;
  fields: CustomCategoryField[];
}

export interface CustomEntryPhoto {
  id: string;
  entry_id: string;
  storage_path: string;
  caption: string;
  position: number;
  signed_url?: string;
}

export interface CustomEntry {
  id: string;
  category_id: string;
  user_id?: string;
  title: string;
  cover_url: string;
  description: string;
  status: CustomEntryStatus;
  values: Record<string, CustomFieldValue>;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
  photos: CustomEntryPhoto[];
}

export interface CustomCategoryInput {
  name_singular: string;
  name_plural: string;
  description: string;
  icon: string;
  accent_color: string;
  planned_label: string;
  completed_label: string;
  fields: Array<Pick<CustomCategoryField, "id" | "label" | "field_type" | "phase" | "required" | "options">>;
}

export interface CustomEntryInput {
  title: string;
  cover_url: string;
  description: string;
  status: CustomEntryStatus;
  values: Record<string, CustomFieldValue>;
}

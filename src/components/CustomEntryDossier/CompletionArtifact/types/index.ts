import type { CustomCategoryField, CustomEntry, CustomFieldValue, CustomLibraryCategory } from "../../../../types/customLibrary";

export interface CompletionArtifactLayoutProps {
  category: CustomLibraryCategory;
  entry: CustomEntry;
  fields: CustomCategoryField[];
  values: Record<string, CustomFieldValue>;
  isSaving: boolean;
  onChange: (fieldId: string, value: CustomFieldValue) => void;
  onSave: () => void;
}

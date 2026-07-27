import type { CustomCategoryField, CustomEntry, CustomFieldValue, CustomLibraryCategory } from "../../../../types/customLibrary";

export interface CompletionArtifactLayoutProps {
  category: CustomLibraryCategory;
  completedAt: string;
  entry: CustomEntry;
  fields: CustomCategoryField[];
  values: Record<string, CustomFieldValue>;
  onChange: (fieldId: string, value: CustomFieldValue) => void;
  onCompletedAtChange: (value: string) => void;
  onCompletedAtCommit: (value: string) => void;
}

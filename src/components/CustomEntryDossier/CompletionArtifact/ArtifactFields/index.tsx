import { CustomFieldInput } from "../../../CustomFieldInput";
import type { CompletionArtifactLayoutProps } from "../types";

interface ArtifactFieldsProps extends Pick<CompletionArtifactLayoutProps, "fields" | "values" | "onChange"> {
  inputVariant?: "dossier" | "artifact-light";
}

export function ArtifactFields({ fields, inputVariant = "dossier", onChange, values }: ArtifactFieldsProps) {
  if (fields.length === 0) return null;

  return (
    <div className="grid gap-3">
      {fields.map((field) => (
        <CustomFieldInput
          key={field.id}
          field={field}
          value={values[field.id]}
          onChange={(value) => onChange(field.id, value)}
          variant={inputVariant}
        />
      ))}
    </div>
  );
}

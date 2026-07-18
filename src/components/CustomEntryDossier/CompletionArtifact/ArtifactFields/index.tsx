import { LoaderCircle, Save } from "lucide-react";
import { CustomFieldInput } from "../../../CustomFieldInput";
import type { CompletionArtifactLayoutProps } from "../types";

interface ArtifactFieldsProps extends Pick<CompletionArtifactLayoutProps, "fields" | "values" | "isSaving" | "onChange" | "onSave"> {
  buttonClass: string;
  inputVariant?: "dossier" | "artifact-light";
}

export function ArtifactFields({
  buttonClass,
  fields,
  inputVariant = "dossier",
  isSaving,
  onChange,
  onSave,
  values,
}: ArtifactFieldsProps) {
  if (fields.length === 0) return null;

  return (
    <>
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
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className={`ml-auto mt-5 flex h-9 items-center justify-center gap-2 rounded-lg px-4 font-mono text-[9px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 ${buttonClass}`}
      >
        {isSaving ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}
        Salvar registro
      </button>
    </>
  );
}

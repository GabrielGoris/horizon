
import { CoverField } from "../CoverField";
import type { CoverDetailsFieldsProps } from "../types";
import { TypeSpecificFields } from "../TypeSpecificFields";

export function CoverDetailsFields({
  catalogSearch,
  copy,
  coverValue,
  errorClass,
  errors,
  inputClass,
  labelClass,
  movieKind,
  onMovieKindChange,
  register,
  selectedType,
  setValue,
  statusValue,
}: CoverDetailsFieldsProps) {
  const coverBackground = catalogSearch.coverBackdrop || coverValue || "";
  const coverInput = register("cover");

  return (
    <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2">
      <CoverField
        coverBackground={coverBackground}
        coverFallback={catalogSearch.coverFallback}
        coverInput={coverInput}
        coverLabel={copy.coverLabel}
        coverValue={coverValue}
        error={errors.cover}
        errorClass={errorClass}
        inputClass={inputClass}
        labelClass={labelClass}
        onUseCoverFallback={(cover) => {
          setValue("cover", cover, { shouldDirty: true, shouldValidate: true });
        }}
      />

      <TypeSpecificFields
        copy={copy}
        errorClass={errorClass}
        errors={errors}
        inputClass={inputClass}
        labelClass={labelClass}
        movieKind={movieKind}
        onMovieKindChange={onMovieKindChange}
        register={register}
        selectedType={selectedType}
        statusValue={statusValue}
      />
    </div>
  );
}

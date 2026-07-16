
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
  metaValue,
  mediaFormat,
  onMediaFormatChange,
  ratingValue,
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
        isCampaignHoursLoading={catalogSearch.isCampaignHoursLoading}
        labelClass={labelClass}
        metaValue={metaValue}
        mediaFormat={mediaFormat}
        onMediaFormatChange={onMediaFormatChange}
        ratingValue={ratingValue}
        register={register}
        selectedType={selectedType}
        setValue={setValue}
        statusValue={statusValue}
      />
    </div>
  );
}


import { CoverField } from "../CoverField";
import type { CoverDetailsFieldsProps } from "../types";
import { TypeSpecificFields } from "../TypeSpecificFields";

export function CoverDetailsFields({
  catalogSearch,
  copy,
  backdropValue,
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
  onUpload,
  isUploading,
}: CoverDetailsFieldsProps) {
  return (
    <div className="flex flex-col gap-6">
      <CoverField coverLabel={copy.coverLabel} coverValue={coverValue} coverInput={register("cover")} coverError={errors.cover} backdropValue={backdropValue} backdropInput={register("backdrop")} backdropError={errors.backdrop} errorClass={errorClass} inputClass={inputClass} labelClass={labelClass} isUploading={isUploading} onUpload={onUpload} onClear={(kind) => setValue(kind, "", { shouldDirty: true, shouldValidate: true })} />
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

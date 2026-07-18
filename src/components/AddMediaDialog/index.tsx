import { useState } from "react";
import { X } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createMediaSchema, type CreateMediaDTO } from "../../schemas/media/dto/create-media.dto";
import { createMedia, hasDuplicateMedia } from "../../services/mediaService";
import type { MediaType } from "../../types";
import { DuplicateMediaDialog } from "../DuplicateMediaDialog";
import { BasicInfoFields } from "./components/BasicInfoFields";
import { CoverDetailsFields } from "./components/CoverDetailsFields";
import { FormActions } from "./components/FormActions";
import { MediaTypePicker } from "./components/MediaTypePicker";
import { fieldCopy, getDefaultValues } from "./consts";
import { useMediaCatalogSearch } from "./hooks/useMediaCatalogSearch";
import type { AddMediaDialogProps, PendingDuplicateMedia } from "./types";

export function AddMediaDialog({ isOpen, onClose, onSuccess, onPriorityCreate, initialType }: AddMediaDialogProps) {
  const [manualSelectedType, setManualSelectedType] = useState<MediaType | null>(null);
  const [mediaFormat, setMediaFormat] = useState<"movie" | "series">("movie");
  const [pendingDuplicate, setPendingDuplicate] = useState<PendingDuplicateMedia | null>(null);
  const [isConfirmingDuplicate, setIsConfirmingDuplicate] = useState(false);
  const {
    control,
    formState: { errors, isSubmitting },
    getValues,
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<CreateMediaDTO>({
    resolver: zodResolver(createMediaSchema),
    defaultValues: getDefaultValues(initialType ?? "games"),
  });
  const selectedType = initialType ?? manualSelectedType;
  const catalogSearch = useMediaCatalogSearch({ getValues, isOpen, selectedType, setValue });
  const coverValue = useWatch({ control, name: "cover" });
  const metaValue = useWatch({ control, name: "meta" });
  const ratingValue = useWatch({ control, name: "rating" });
  const statusValue = useWatch({ control, name: "status" });

  const copy = selectedType ? fieldCopy[selectedType] : null;
  const inputClass = "w-full rounded-lg border border-white/10 bg-[#131315] px-4 py-3 text-sm text-white placeholder-neutral-600 outline-none transition-all focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]";
  const labelClass = "flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-400";
  const errorClass = "text-[10px] text-red-400 normal-case tracking-normal";

  const clearDialogState = (type = initialType ?? "games") => {
    setManualSelectedType(null);
    setMediaFormat("movie");
    setPendingDuplicate(null);
    setIsConfirmingDuplicate(false);
    reset(getDefaultValues(type));
    catalogSearch.clearCatalogSearch();
  };

  const selectType = (type: MediaType) => {
    setManualSelectedType(type);
    setMediaFormat("movie");
    reset(getDefaultValues(type));
    setValue("type", type);
    setValue("media_format", "movie");
    catalogSearch.clearCatalogSearch();
  };

  const closeDialog = () => {
    clearDialogState();
    onClose();
  };

  const updateMediaFormat = (nextMediaFormat: "movie" | "series") => {
    setMediaFormat(nextMediaFormat);
    setValue("media_format", nextMediaFormat, { shouldDirty: true, shouldValidate: true });
    setValue("runtime_minutes", "", { shouldDirty: true, shouldValidate: true });
    setValue("season_count", "", { shouldDirty: true, shouldValidate: true });
    setValue("episode_count", "", { shouldDirty: true, shouldValidate: true });
    if (selectedType === "movies" && nextMediaFormat === "movie" && getValues("status") === "incomplete") {
      setValue("status", "queue", { shouldDirty: true, shouldValidate: true });
    }
  };

  const persistMedia = async (data: CreateMediaDTO, shouldPrioritize: boolean, allowDuplicate = false) => {
    try {
      if (!allowDuplicate && await hasDuplicateMedia(data)) {
        setPendingDuplicate({ data, shouldPrioritize });
        return;
      }

      const createdMedia = await createMedia(data);
      if (!createdMedia) return;

      setPendingDuplicate(null);
      await onSuccess();
      clearDialogState(data.type);
      onClose();

      if (shouldPrioritize && createdMedia) {
        await onPriorityCreate?.(createdMedia);
      }
    } catch (error) {
      console.error("Erro ao guardar:", error);
      alert("Erro ao guardar a obra.");
    }
  };

  const onSubmit = async (data: CreateMediaDTO, shouldPrioritize = false) => {
    if (!selectedType || catalogSearch.isCatalogSelectionLoading) return;

    const nextData = selectedType === "movies" || selectedType === "animes"
      ? { ...data, type: selectedType, media_format: mediaFormat }
      : { ...data, type: selectedType };

    await persistMedia(nextData, shouldPrioritize);
  };

  const confirmDuplicate = async () => {
    if (!pendingDuplicate || isConfirmingDuplicate) return;

    setIsConfirmingDuplicate(true);
    try {
      await persistMedia(pendingDuplicate.data, pendingDuplicate.shouldPrioritize, true);
    } finally {
      setIsConfirmingDuplicate(false);
    }
  };

  const isFormBusy = isSubmitting || catalogSearch.isCatalogSelectionLoading;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeDialog();
      }}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1a1a1e] shadow-2xl"
      >
        <div className="shrink-0 border-b border-white/5 px-8 pb-4 pt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-3xl font-bold text-[#ebdcb9]">
                {copy?.title ?? "Adicionar ao Catalogo"}
              </h2>
              {!initialType && selectedType && (
                <button
                  type="button"
                  onClick={() => {
                    setManualSelectedType(null);
                    catalogSearch.clearCatalogSearch();
                  }}
                  className="mt-2 font-mono text-[10px] uppercase tracking-widest text-neutral-500 transition-colors hover:text-noir-gold"
                >
                  Trocar tipo
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={closeDialog}
              aria-label="Fechar"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {!selectedType && (
          <div className="overflow-y-auto px-8 py-6">
            <MediaTypePicker onSelect={selectType} />
          </div>
        )}

        {selectedType && copy && (
          <form onSubmit={handleSubmit((data) => onSubmit(data))} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className="flex flex-col gap-6">
                <BasicInfoFields
                  catalogSearch={catalogSearch}
                  copy={copy}
                  errorClass={errorClass}
                  errors={errors}
                  getValues={getValues}
                  inputClass={inputClass}
                  labelClass={labelClass}
                  onMediaFormatChange={setMediaFormat}
                  register={register}
                  selectedType={selectedType}
                  setValue={setValue}
                />

                <CoverDetailsFields
                  catalogSearch={catalogSearch}
                  copy={copy}
                  coverValue={coverValue}
                  errorClass={errorClass}
                  errors={errors}
                  inputClass={inputClass}
                  labelClass={labelClass}
                  metaValue={metaValue}
                  mediaFormat={mediaFormat}
                  onMediaFormatChange={updateMediaFormat}
                  ratingValue={ratingValue}
                  register={register}
                  selectedType={selectedType}
                  setValue={setValue}
                  statusValue={statusValue}
                />

                <label className={labelClass}>
                  {copy.descriptionLabel}
                  <textarea
                    rows={3}
                    placeholder={copy.descriptionPlaceholder}
                    {...register("description")}
                    className={`${inputClass} resize-none`}
                  />
                </label>
              </div>
            </div>

            <FormActions
              isCatalogSelectionLoading={catalogSearch.isCatalogSelectionLoading}
              isSubmitting={isFormBusy}
              onCancel={closeDialog}
              onSubmitWithPriority={handleSubmit((data) => onSubmit(data, true))}
            />
          </form>
        )}
      </div>

      {pendingDuplicate && (
        <DuplicateMediaDialog
          cover={pendingDuplicate.data.cover}
          isConfirming={isConfirmingDuplicate}
          onCancel={() => setPendingDuplicate(null)}
          onConfirm={confirmDuplicate}
          title={pendingDuplicate.data.title}
        />
      )}
    </div>
  );
}

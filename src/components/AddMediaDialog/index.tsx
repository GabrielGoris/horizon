import { useState } from "react";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createMediaSchema, type CreateMediaDTO } from "../../schemas/media/dto/create-media.dto";
import { createMedia } from "../../services/mediaService";
import type { MediaType } from "../../types";
import { fieldCopy, getDefaultValues, typeOptions } from "./consts";

interface AddMediaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
  initialType?: MediaType | null;
}

export function AddMediaDialog({ isOpen, onClose, onSuccess, initialType }: AddMediaDialogProps) {
  const [manualSelectedType, setManualSelectedType] = useState<MediaType | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateMediaDTO>({
    resolver: zodResolver(createMediaSchema),
    defaultValues: getDefaultValues(initialType ?? "games"),
  });

  const selectedType = initialType ?? manualSelectedType;

  if (!isOpen) return null;

  const selectType = (type: MediaType) => {
    setManualSelectedType(type);
    reset(getDefaultValues(type));
    setValue("type", type);
  };

  const closeDialog = () => {
    setManualSelectedType(null);
    reset(getDefaultValues(initialType ?? "games"));
    onClose();
  };

  const onSubmit = async (data: CreateMediaDTO) => {
    if (!selectedType) return;

    try {
      await createMedia({ ...data, type: selectedType });
      await onSuccess();
      reset(getDefaultValues(selectedType));
      setManualSelectedType(null);
      onClose();
    } catch (error) {
      console.error("Erro ao guardar:", error);
      alert("Erro ao guardar a obra.");
    }
  };

  const copy = selectedType ? fieldCopy[selectedType] : null;
  const inputClass = "w-full rounded-lg border border-white/10 bg-[#131315] px-4 py-3 text-sm text-white placeholder-neutral-600 outline-none transition-all focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]";
  const labelClass = "flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-400";
  const errorClass = "text-[10px] text-red-400 normal-case tracking-normal";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#1a1a1e] p-8 shadow-2xl">
        <div className="mb-8 flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h2 className="font-serif text-3xl font-bold text-[#ebdcb9]">
              {copy?.title ?? "Adicionar ao Catalogo"}
            </h2>
            {!initialType && selectedType && (
              <button
                type="button"
                onClick={() => setManualSelectedType(null)}
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

        {!selectedType && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {typeOptions.map((option) => {
              const Icon = option.icon;

              return (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => selectType(option.type)}
                  className="rounded-xl border border-white/10 bg-white/[0.025] p-5 text-left transition-all hover:-translate-y-0.5 hover:border-noir-gold/35 hover:bg-white/[0.045]"
                >
                  <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-noir-gold/10 text-noir-gold">
                    <Icon size={19} />
                  </span>
                  <strong className="block font-serif text-xl text-white">
                    {option.title}
                  </strong>
                  <span className="mt-2 block text-xs leading-5 text-neutral-500">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {selectedType && copy && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <label className={labelClass}>
                {copy.nameLabel}
                <input
                  placeholder={copy.namePlaceholder}
                  {...register("title")}
                  className={`${inputClass} ${errors.title ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : ""}`}
                />
                {errors.title && <span className={errorClass}>{errors.title.message}</span>}
              </label>

              <label className={labelClass}>
                {copy.creatorLabel}
                <input
                  placeholder={copy.creatorPlaceholder}
                  {...register("creator")}
                  className={inputClass}
                />
              </label>
            </div>

            {selectedType === "movies" && (
              <label className={labelClass}>
                {fieldCopy.movies.directorLabel}
                <input
                  placeholder={fieldCopy.movies.directorPlaceholder}
                  {...register("director")}
                  className={inputClass}
                />
              </label>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <label className={labelClass}>
                Genero / Categoria
                <input
                  placeholder={copy.categoryPlaceholder}
                  {...register("category")}
                  className={inputClass}
                />
              </label>

              <label className={labelClass}>
                Ano
                <input
                  placeholder="Ex: 2024"
                  {...register("release_year")}
                  className={inputClass}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <label className={labelClass}>
                {copy.coverLabel}
                <input
                  placeholder="https://..."
                  {...register("cover")}
                  className={`${inputClass} ${errors.cover ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : ""}`}
                />
                {errors.cover && <span className={errorClass}>{errors.cover.message}</span>}
              </label>

              <label className={labelClass}>
                Estado na Biblioteca *
                <select {...register("status")} className={inputClass}>
                  <option value="queue">{copy.statusOptions.queue}</option>
                  <option value="reading">{copy.statusOptions.reading}</option>
                  <option value="new">{copy.statusOptions.new}</option>
                  <option value="complete">{copy.statusOptions.complete}</option>
                </select>
                {errors.status && <span className={errorClass}>{errors.status.message}</span>}
              </label>
            </div>

            <label className={labelClass}>
              {copy.metaLabel}
              <input
                placeholder={copy.metaPlaceholder}
                {...register("meta")}
                className={inputClass}
              />
            </label>

            <label className={labelClass}>
              {copy.descriptionLabel}
              <textarea
                rows={3}
                placeholder={copy.descriptionPlaceholder}
                {...register("description")}
                className={`${inputClass} resize-none`}
              />
            </label>

            <div className="mt-4 flex items-center justify-end gap-4 border-t border-white/5 pt-6">
              <button
                type="button"
                onClick={closeDialog}
                className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-neutral-400 transition-colors hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-[#d4af37] px-8 py-3 text-xs font-bold uppercase tracking-wider text-black shadow-lg shadow-[#d4af37]/20 transition-all hover:-translate-y-0.5 hover:bg-[#ebdcb9] disabled:opacity-50 disabled:hover:transform-none"
              >
                {isSubmitting ? "Guardando..." : "Guardar Obra"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

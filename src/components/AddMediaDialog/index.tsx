import { useState } from "react";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createMediaSchema, type CreateMediaDTO } from "../../schemas/media/dto/create-media.dto";
import { createMedia } from "../../services/mediaService";
import type { MediaType } from "../../types";
import { CatalogTitleField } from "./components/CatalogTitleField";
import { CoverField } from "./components/CoverField";
import { MediaTypePicker } from "./components/MediaTypePicker";
import { TypeSpecificFields } from "./components/TypeSpecificFields";
import { fieldCopy, getDefaultValues } from "./consts";
import { useMediaCatalogSearch } from "./hooks/useMediaCatalogSearch";
import type { AddMediaDialogProps } from "./types";

export function AddMediaDialog({ isOpen, onClose, onSuccess, initialType }: AddMediaDialogProps) {
  const [manualSelectedType, setManualSelectedType] = useState<MediaType | null>(null);
  const [movieKind, setMovieKind] = useState<"movie" | "series">("movie");
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateMediaDTO>({
    resolver: zodResolver(createMediaSchema),
    defaultValues: getDefaultValues(initialType ?? "games"),
  });
  const selectedType = initialType ?? manualSelectedType;
  const catalogSearch = useMediaCatalogSearch({ selectedType, setValue });

  if (!isOpen) return null;

  const selectType = (type: MediaType) => {
    setManualSelectedType(type);
    setMovieKind("movie");
    reset(getDefaultValues(type));
    setValue("type", type);
    setValue("movie_kind", "movie");
    catalogSearch.clearCatalogSearch();
  };

  const closeDialog = () => {
    setManualSelectedType(null);
    setMovieKind("movie");
    reset(getDefaultValues(initialType ?? "games"));
    catalogSearch.clearCatalogSearch();
    onClose();
  };

  const onSubmit = async (data: CreateMediaDTO) => {
    if (!selectedType) return;

    try {
      const nextData = selectedType === "movies"
        ? { ...data, type: selectedType, movie_kind: movieKind }
        : { ...data, type: selectedType };

      await createMedia(nextData);
      await onSuccess();
      reset(getDefaultValues(selectedType));
      setManualSelectedType(null);
      setMovieKind("movie");
      catalogSearch.clearCatalogSearch();
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
  const titleInput = register("title");
  const coverInput = register("cover");
  const coverValue = watch("cover");
  const statusValue = watch("status");
  const coverBackground = catalogSearch.coverBackdrop || coverValue || "";

  const updateMovieKind = (nextMovieKind: "movie" | "series") => {
    setMovieKind(nextMovieKind);
    setValue("movie_kind", nextMovieKind, { shouldDirty: true, shouldValidate: true });
    setValue("runtime_minutes", "", { shouldDirty: true, shouldValidate: true });
    setValue("season_count", "", { shouldDirty: true, shouldValidate: true });
    setValue("episode_count", "", { shouldDirty: true, shouldValidate: true });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={closeDialog}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#1a1a1e] p-8 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-8 flex items-center justify-between border-b border-white/5 pb-4">
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

        {!selectedType && <MediaTypePicker onSelect={selectType} />}

        {selectedType && copy && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <CatalogTitleField
                bookSearchError={catalogSearch.bookSearchError}
                bookSearchResults={catalogSearch.bookSearchResults}
                copy={copy}
                error={errors.title}
                errorClass={errorClass}
                gameSearchError={catalogSearch.gameSearchError}
                gameSearchResults={catalogSearch.gameSearchResults}
                inputClass={inputClass}
                isBookSearchLoading={catalogSearch.isBookSearchLoading}
                isGameSearchLoading={catalogSearch.isGameSearchLoading}
                isMovieSearchLoading={catalogSearch.isMovieSearchLoading}
                labelClass={labelClass}
                movieSearchError={catalogSearch.movieSearchError}
                movieSearchResults={catalogSearch.movieSearchResults}
                onBlur={catalogSearch.clearResultsLater}
                onChange={catalogSearch.searchTitle}
                onFocus={() => catalogSearch.searchCurrentTitle(String(watch("title") ?? ""))}
                onSelectBook={(book) => void catalogSearch.handleSelectBook(book)}
                onSelectGame={(game) => void catalogSearch.handleSelectGame(game)}
                onSelectMovie={(movie) => {
                  const nextMovieKind = movie.mediaType === "tv" ? "series" : "movie";
                  setMovieKind(nextMovieKind);
                  setValue("movie_kind", nextMovieKind, { shouldDirty: true, shouldValidate: true });
                  void catalogSearch.handleSelectMovie(movie);
                }}
                selectedType={selectedType}
                titleInput={titleInput}
              />

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
              <CoverField
                coverBackground={coverBackground}
                coverInput={coverInput}
                coverLabel={copy.coverLabel}
                coverValue={coverValue}
                error={errors.cover}
                errorClass={errorClass}
                inputClass={inputClass}
                labelClass={labelClass}
              />

              <TypeSpecificFields
                copy={copy}
                errorClass={errorClass}
                errors={errors}
                inputClass={inputClass}
                labelClass={labelClass}
                movieKind={movieKind}
                onMovieKindChange={updateMovieKind}
                register={register}
                selectedType={selectedType}
                statusValue={statusValue}
              />
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

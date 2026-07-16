import type { MovieCatalogResult } from "../../../../services/types";
import { fieldCopy } from "../../consts";
import { CatalogTitleField } from "../CatalogTitleField";
import type { BasicInfoFieldsProps } from "../types";

export function BasicInfoFields({
  catalogSearch,
  copy,
  errorClass,
  errors,
  getValues,
  inputClass,
  labelClass,
  onMediaFormatChange,
  register,
  selectedType,
  setValue,
}: BasicInfoFieldsProps) {
  const titleInput = register("title");

  const selectMovie = (movie: MovieCatalogResult) => {
    const nextMediaFormat = movie.mediaType === "tv" ? "series" : "movie";

    onMediaFormatChange(nextMediaFormat);
    setValue("media_format", nextMediaFormat, { shouldDirty: true, shouldValidate: true });
    void catalogSearch.handleSelectMovie(movie);
  };

  return (
    <>
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
          onFocus={() => catalogSearch.searchCurrentTitle(String(getValues("title") ?? ""))}
          onSelectBook={(book) => void catalogSearch.handleSelectBook(book)}
          onSelectGame={(game) => void catalogSearch.handleSelectGame(game)}
          onSelectMovie={selectMovie}
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

      {(selectedType === "movies" || selectedType === "animes") && (
        <label className={labelClass}>
          {selectedType === "animes" ? fieldCopy.animes.directorLabel : fieldCopy.movies.directorLabel}
          <input
            placeholder={selectedType === "animes" ? fieldCopy.animes.directorPlaceholder : fieldCopy.movies.directorPlaceholder}
            {...register("director")}
            className={inputClass}
          />
        </label>
      )}

      {selectedType === "books" && (
        <label className={labelClass}>
          ISBN da edição
          <input
            placeholder="Ex: 9788535909555"
            {...register("isbn", {
              onChange: (event) => catalogSearch.searchBookIsbn(event.target.value),
            })}
            className={inputClass}
          />
          {catalogSearch.bookIsbnSearchError && (
            <span className={errorClass}>{catalogSearch.bookIsbnSearchError}</span>
          )}
          {catalogSearch.isBookIsbnSearchLoading && (
            <span className="text-[10px] text-noir-gold normal-case tracking-normal">
              Buscando edição pelo ISBN...
            </span>
          )}
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
    </>
  );
}

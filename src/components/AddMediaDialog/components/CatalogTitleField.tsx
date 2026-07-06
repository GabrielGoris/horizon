import type { ChangeEvent, FocusEvent } from "react";
import type { CatalogTitleFieldProps, SearchErrorProps, SearchResultButtonProps } from "../types";

export function CatalogTitleField({
  bookSearchError,
  bookSearchResults,
  copy,
  error,
  errorClass,
  gameSearchError,
  gameSearchResults,
  inputClass,
  isBookSearchLoading,
  isGameSearchLoading,
  isMovieSearchLoading,
  labelClass,
  movieSearchError,
  movieSearchResults,
  onBlur,
  onChange,
  onFocus,
  onSelectBook,
  onSelectGame,
  onSelectMovie,
  selectedType,
  titleInput,
}: CatalogTitleFieldProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    void titleInput.onChange(event);
    onChange(event.target.value);
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    void titleInput.onBlur(event);
    onBlur();
  };

  return (
    <label className={`${labelClass} relative`}>
      {copy.nameLabel}
      <input
        placeholder={copy.namePlaceholder}
        {...titleInput}
        onBlur={handleBlur}
        onChange={handleChange}
        onFocus={onFocus}
        className={`${inputClass} ${error ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : ""}`}
      />
      {error && <span className={errorClass}>{error.message}</span>}
      {selectedType === "games" && isGameSearchLoading && <SearchLoading />}
      {selectedType === "movies" && isMovieSearchLoading && <SearchLoading />}
      {selectedType === "books" && isBookSearchLoading && <SearchLoading />}
      {selectedType === "games" && gameSearchError && <SearchError message={gameSearchError} />}
      {selectedType === "movies" && movieSearchError && <SearchError message={movieSearchError} />}
      {selectedType === "books" && bookSearchError && <SearchError message={bookSearchError} />}
      {selectedType === "games" && gameSearchResults.length > 0 && (
        <div
          data-game-search-results
          className="absolute left-0 right-0 top-[74px] z-20 max-h-[28rem] overflow-y-auto rounded-xl border border-white/10 bg-[#111114] p-2 shadow-2xl shadow-black/50"
        >
          {gameSearchResults.map((game) => (
            <SearchResultButton
              key={`${game.source}-${game.id}`}
              cover={game.cover}
              details={[game.source.toUpperCase(), game.releaseYear, game.category].filter(Boolean).join(" - ") || "Sem detalhes"}
              title={game.title}
              onClick={() => onSelectGame(game)}
            />
          ))}
        </div>
      )}
      {selectedType === "movies" && movieSearchResults.length > 0 && (
        <div
          data-movie-search-results
          className="absolute left-0 right-0 top-[74px] z-20 max-h-[28rem] overflow-y-auto rounded-xl border border-white/10 bg-[#111114] p-2 shadow-2xl shadow-black/50"
        >
          {movieSearchResults.map((movie) => (
            <SearchResultButton
              key={`${movie.source}-${movie.mediaType}-${movie.id}`}
              cover={movie.cover}
              details={[movie.mediaType === "movie" ? "FILME" : "SERIE", movie.releaseYear, movie.category].filter(Boolean).join(" - ") || "Sem detalhes"}
              title={movie.title}
              onClick={() => onSelectMovie(movie)}
            />
          ))}
        </div>
      )}
      {selectedType === "books" && bookSearchResults.length > 0 && (
        <div
          data-book-search-results
          className="absolute left-0 right-0 top-[74px] z-20 max-h-[28rem] overflow-y-auto rounded-xl border border-white/10 bg-[#111114] p-2 shadow-2xl shadow-black/50"
        >
          {bookSearchResults.map((book) => (
            <SearchResultButton
              key={`${book.source}-${book.id}`}
              cover={book.cover}
              details={[book.author, book.releaseYear, book.pageCount ? `${book.pageCount} PAG` : "", book.category].filter(Boolean).join(" - ") || "Sem detalhes"}
              title={book.title}
              onClick={() => onSelectBook(book)}
            />
          ))}
        </div>
      )}
    </label>
  );
}

function SearchLoading() {
  return (
    <span className="absolute right-3 top-[35px] font-mono text-[9px] uppercase tracking-widest text-neutral-500">
      Buscando
    </span>
  );
}

function SearchError({ message }: SearchErrorProps) {
  return (
    <span className="text-[10px] text-red-300 normal-case tracking-normal">
      {message}
    </span>
  );
}

function SearchResultButton({ cover, details, onClick, title }: SearchResultButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/[0.055]"
    >
      <div className="h-14 w-10 shrink-0 overflow-hidden rounded bg-white/5">
        {cover && (
          <img
            src={cover}
            alt={title}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="min-w-0">
        <strong className="block truncate text-sm text-white">
          {title}
        </strong>
        <span className="mt-1 block truncate font-mono text-[10px] uppercase tracking-wider text-neutral-500">
          {details}
        </span>
      </div>
    </button>
  );
}

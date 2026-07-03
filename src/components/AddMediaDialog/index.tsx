import { useRef, useState, type ChangeEvent } from "react";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createMediaSchema, type CreateMediaDTO } from "../../schemas/media/dto/create-media.dto";
import {
  applyBookCatalogDetails,
  getBookDetails,
  searchBooks,
} from "../../services/bookCatalogService";
import {
  applyGameCatalogDetails,
  getGameDetails,
  searchGames
} from "../../services/gameCatalogService";
import { createMedia } from "../../services/mediaService";
import {
  applyMovieCatalogDetails,
  getMovieDetails,
  searchMovies,
} from "../../services/movieCatalogService";
import type { BookCatalogResult, GameCatalogResult, MovieCatalogResult } from "../../services/types";
import type { MediaType } from "../../types";
import { fieldCopy, getDefaultValues, typeOptions } from "./consts";

function isMissingColumnError(error: unknown, column: string) {
  if (!error || typeof error !== "object") return false;

  const supabaseError = error as { code?: string; message?: string };

  return supabaseError.code === "PGRST204" && Boolean(supabaseError.message?.includes(column));
}

interface AddMediaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
  initialType?: MediaType | null;
}

export function AddMediaDialog({ isOpen, onClose, onSuccess, initialType }: AddMediaDialogProps) {
  const [manualSelectedType, setManualSelectedType] = useState<MediaType | null>(null);
  const [gameSearchResults, setGameSearchResults] = useState<GameCatalogResult[]>([]);
  const [movieSearchResults, setMovieSearchResults] = useState<MovieCatalogResult[]>([]);
  const [bookSearchResults, setBookSearchResults] = useState<BookCatalogResult[]>([]);
  const [gameSearchError, setGameSearchError] = useState("");
  const [movieSearchError, setMovieSearchError] = useState("");
  const [bookSearchError, setBookSearchError] = useState("");
  const [coverBackdrop, setCoverBackdrop] = useState("");
  const [isGameSearchLoading, setIsGameSearchLoading] = useState(false);
  const [isMovieSearchLoading, setIsMovieSearchLoading] = useState(false);
  const [isBookSearchLoading, setIsBookSearchLoading] = useState(false);
  const gameSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const movieSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bookSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameSearchRequestRef = useRef(0);
  const movieSearchRequestRef = useRef(0);
  const bookSearchRequestRef = useRef(0);
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

  if (!isOpen) return null;

  const selectType = (type: MediaType) => {
    setManualSelectedType(type);
    reset(getDefaultValues(type));
    setValue("type", type);
    clearGameSearch();
  };

  const closeDialog = () => {
    setManualSelectedType(null);
    reset(getDefaultValues(initialType ?? "games"));
    clearGameSearch();
    onClose();
  };

  const clearGameSearch = () => {
    if (gameSearchTimeoutRef.current) {
      clearTimeout(gameSearchTimeoutRef.current);
    }

    if (movieSearchTimeoutRef.current) {
      clearTimeout(movieSearchTimeoutRef.current);
    }

    if (bookSearchTimeoutRef.current) {
      clearTimeout(bookSearchTimeoutRef.current);
    }

    gameSearchRequestRef.current += 1;
    movieSearchRequestRef.current += 1;
    bookSearchRequestRef.current += 1;
    setGameSearchResults([]);
    setMovieSearchResults([]);
    setBookSearchResults([]);
    setGameSearchError("");
    setMovieSearchError("");
    setBookSearchError("");
    setCoverBackdrop("");
    setIsGameSearchLoading(false);
    setIsMovieSearchLoading(false);
    setIsBookSearchLoading(false);
  };

  const fillMediaFields = (media: Partial<CreateMediaDTO>) => {
    Object.entries(media).forEach(([key, value]) => {
      setValue(key as keyof CreateMediaDTO, value ?? "", { shouldDirty: true, shouldValidate: true });
    });
  };

  const scheduleGameSearch = (query: string) => {
    const trimmedQuery = query.trim();

    if (gameSearchTimeoutRef.current) {
      clearTimeout(gameSearchTimeoutRef.current);
    }

    gameSearchRequestRef.current += 1;

    setGameSearchError("");

    if (selectedType !== "games" || trimmedQuery.length < 2) {
      setGameSearchResults([]);
      setIsGameSearchLoading(false);
      return;
    }

    setIsGameSearchLoading(true);

    const requestId = gameSearchRequestRef.current;

    gameSearchTimeoutRef.current = setTimeout(() => {
      searchGames(trimmedQuery)
        .then((results) => {
          if (requestId !== gameSearchRequestRef.current) return;

          setGameSearchResults(results);
          setGameSearchError(results.length === 0 ? "Nenhum jogo encontrado." : "");
        })
        .catch((error) => {
          if (requestId !== gameSearchRequestRef.current) return;

          console.error(error);
          setGameSearchResults([]);
          setGameSearchError(error instanceof Error ? error.message : "Erro ao buscar jogos.");
        })
        .finally(() => {
          if (requestId === gameSearchRequestRef.current) {
            setIsGameSearchLoading(false);
          }
        });
    }, 250);
  };

  const scheduleMovieSearch = (query: string) => {
    const trimmedQuery = query.trim();

    if (movieSearchTimeoutRef.current) {
      clearTimeout(movieSearchTimeoutRef.current);
    }

    movieSearchRequestRef.current += 1;

    setMovieSearchError("");

    if (selectedType !== "movies" || trimmedQuery.length < 2) {
      setMovieSearchResults([]);
      setIsMovieSearchLoading(false);
      return;
    }

    setIsMovieSearchLoading(true);

    const requestId = movieSearchRequestRef.current;

    movieSearchTimeoutRef.current = setTimeout(() => {
      searchMovies(trimmedQuery)
        .then((results) => {
          if (requestId !== movieSearchRequestRef.current) return;

          setMovieSearchResults(results);
          setMovieSearchError(results.length === 0 ? "Nenhum filme ou serie encontrado." : "");
        })
        .catch((error) => {
          if (requestId !== movieSearchRequestRef.current) return;

          console.error(error);
          setMovieSearchResults([]);
          setMovieSearchError(error instanceof Error ? error.message : "Erro ao buscar filmes e series.");
        })
        .finally(() => {
          if (requestId === movieSearchRequestRef.current) {
            setIsMovieSearchLoading(false);
          }
        });
    }, 250);
  };

  const scheduleBookSearch = (query: string) => {
    const trimmedQuery = query.trim();

    if (bookSearchTimeoutRef.current) {
      clearTimeout(bookSearchTimeoutRef.current);
    }

    bookSearchRequestRef.current += 1;

    setBookSearchError("");

    if (selectedType !== "books" || trimmedQuery.length < 2) {
      setBookSearchResults([]);
      setIsBookSearchLoading(false);
      return;
    }

    setIsBookSearchLoading(true);

    const requestId = bookSearchRequestRef.current;

    bookSearchTimeoutRef.current = setTimeout(() => {
      searchBooks(trimmedQuery)
        .then((results) => {
          if (requestId !== bookSearchRequestRef.current) return;

          setBookSearchResults(results);
          setBookSearchError(results.length === 0 ? "Nenhum livro encontrado." : "");
        })
        .catch((error) => {
          if (requestId !== bookSearchRequestRef.current) return;

          console.error(error);
          setBookSearchResults([]);
          setBookSearchError(error instanceof Error ? error.message : "Erro ao buscar livros.");
        })
        .finally(() => {
          if (requestId === bookSearchRequestRef.current) {
            setIsBookSearchLoading(false);
          }
        });
    }, 250);
  };

  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    void titleInput.onChange(event);
    scheduleGameSearch(event.target.value);
    scheduleMovieSearch(event.target.value);
    scheduleBookSearch(event.target.value);
  };

  const handleCoverChange = (event: ChangeEvent<HTMLInputElement>) => {
    void coverInput.onChange(event);
  };

  const handleTitleFocus = () => {
    const currentTitle = String(watch("title") ?? "");

    if (selectedType === "games" && currentTitle.trim().length >= 2 && gameSearchResults.length === 0) {
      scheduleGameSearch(currentTitle);
    }

    if (selectedType === "movies" && currentTitle.trim().length >= 2 && movieSearchResults.length === 0) {
      scheduleMovieSearch(currentTitle);
    }

    if (selectedType === "books" && currentTitle.trim().length >= 2 && bookSearchResults.length === 0) {
      scheduleBookSearch(currentTitle);
    }
  };

  const handleTitleBlur = () => {
    window.setTimeout(() => {
      if (document.activeElement?.closest("[data-game-search-results]")) {
        return;
      }

      if (document.activeElement?.closest("[data-movie-search-results]")) {
        return;
      }

      if (document.activeElement?.closest("[data-book-search-results]")) {
        return;
      }

      setGameSearchResults([]);
      setMovieSearchResults([]);
      setBookSearchResults([]);
    }, 120);
  };

  const handleSelectGame = async (game: GameCatalogResult) => {
    setGameSearchError("");
    setIsGameSearchLoading(true);

    try {
      const details = await getGameDetails(game);
      const backdrop = details.backdrop || game.backdrop || details.cover || game.cover;

      fillMediaFields(applyGameCatalogDetails(details));
      setValue("backdrop", backdrop, { shouldDirty: true, shouldValidate: true });
      setCoverBackdrop(backdrop);
      setGameSearchResults([]);
    } catch (error) {
      console.error(error);
      const backdrop = game.backdrop || game.cover;

      fillMediaFields(applyGameCatalogDetails({ ...game, creator: "", description: "" }));
      setValue("backdrop", backdrop, { shouldDirty: true, shouldValidate: true });
      setCoverBackdrop(backdrop);
      setGameSearchError("Preenchi com os dados basicos, mas nao consegui carregar os detalhes.");
    } finally {
      setIsGameSearchLoading(false);
    }
  };

  const handleSelectMovie = async (movie: MovieCatalogResult) => {
    setMovieSearchError("");
    setIsMovieSearchLoading(true);

    try {
      const details = await getMovieDetails(movie);
      const backdrop = details.backdrop || movie.backdrop || details.cover || movie.cover;

      fillMediaFields(applyMovieCatalogDetails(details));
      setValue("backdrop", backdrop, { shouldDirty: true, shouldValidate: true });
      setCoverBackdrop(backdrop);
      setMovieSearchResults([]);
    } catch (error) {
      console.error(error);
      const backdrop = movie.backdrop || movie.cover;

      fillMediaFields(applyMovieCatalogDetails({ ...movie, creator: "", director: "", description: "" }));
      setValue("backdrop", backdrop, { shouldDirty: true, shouldValidate: true });
      setCoverBackdrop(backdrop);
      setMovieSearchError("Preenchi com os dados basicos, mas nao consegui carregar os detalhes.");
    } finally {
      setIsMovieSearchLoading(false);
    }
  };

  const handleSelectBook = async (book: BookCatalogResult) => {
    setBookSearchError("");
    setIsBookSearchLoading(true);

    try {
      const details = await getBookDetails(book);
      const backdrop = details.backdrop || book.backdrop || details.cover || book.cover;

      fillMediaFields(applyBookCatalogDetails(details));
      setValue("backdrop", backdrop, { shouldDirty: true, shouldValidate: true });
      setCoverBackdrop(backdrop);
      setBookSearchResults([]);
    } catch (error) {
      console.error(error);
      const backdrop = book.backdrop || book.cover;

      fillMediaFields(applyBookCatalogDetails({ ...book, description: "" }));
      setValue("backdrop", backdrop, { shouldDirty: true, shouldValidate: true });
      setCoverBackdrop(backdrop);
      setBookSearchError("Preenchi com os dados basicos, mas nao consegui carregar os detalhes.");
    } finally {
      setIsBookSearchLoading(false);
    }
  };

  const onSubmit = async (data: CreateMediaDTO) => {
    if (!selectedType) return;

    try {
      await createMedia({ ...data, type: selectedType });
      await onSuccess();
      reset(getDefaultValues(selectedType));
      setManualSelectedType(null);
      clearGameSearch();
      onClose();
    } catch (error) {
      console.error("Erro ao guardar:", error);

      if (isMissingColumnError(error, "backdrop")) {
        alert("Falta adicionar a coluna backdrop no Supabase para salvar o fundo/banner da obra.");
        return;
      }

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
  const coverBackground = coverBackdrop || coverValue;

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
                onClick={() => {
                  setManualSelectedType(null);
                  clearGameSearch();
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
              <label className={`${labelClass} relative`}>
                {copy.nameLabel}
                <input
                  placeholder={copy.namePlaceholder}
                  {...titleInput}
                  onBlur={(event) => {
                    void titleInput.onBlur(event);
                    handleTitleBlur();
                  }}
                  onChange={handleTitleChange}
                  onFocus={handleTitleFocus}
                  className={`${inputClass} ${errors.title ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : ""}`}
                />
                {errors.title && <span className={errorClass}>{errors.title.message}</span>}
                {selectedType === "games" && isGameSearchLoading && (
                  <span className="absolute right-3 top-[35px] font-mono text-[9px] uppercase tracking-widest text-neutral-500">
                    Buscando
                  </span>
                )}
                {selectedType === "movies" && isMovieSearchLoading && (
                  <span className="absolute right-3 top-[35px] font-mono text-[9px] uppercase tracking-widest text-neutral-500">
                    Buscando
                  </span>
                )}
                {selectedType === "books" && isBookSearchLoading && (
                  <span className="absolute right-3 top-[35px] font-mono text-[9px] uppercase tracking-widest text-neutral-500">
                    Buscando
                  </span>
                )}
                {selectedType === "games" && gameSearchError && (
                  <span className="text-[10px] text-red-300 normal-case tracking-normal">
                    {gameSearchError}
                  </span>
                )}
                {selectedType === "movies" && movieSearchError && (
                  <span className="text-[10px] text-red-300 normal-case tracking-normal">
                    {movieSearchError}
                  </span>
                )}
                {selectedType === "books" && bookSearchError && (
                  <span className="text-[10px] text-red-300 normal-case tracking-normal">
                    {bookSearchError}
                  </span>
                )}
                {selectedType === "games" && gameSearchResults.length > 0 && (
                  <div
                    data-game-search-results
                    className="absolute left-0 right-0 top-[74px] z-20 max-h-[28rem] overflow-y-auto rounded-xl border border-white/10 bg-[#111114] p-2 shadow-2xl shadow-black/50"
                  >
                    {gameSearchResults.map((game) => (
                      <button
                        key={`${game.source}-${game.id}`}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => void handleSelectGame(game)}
                        className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/[0.055]"
                      >
                        <div className="h-14 w-10 shrink-0 overflow-hidden rounded bg-white/5">
                          {game.cover && (
                            <img
                              src={game.cover}
                              alt={game.title}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <strong className="block truncate text-sm text-white">
                            {game.title}
                          </strong>
                          <span className="mt-1 block truncate font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                            {[game.source.toUpperCase(), game.releaseYear, game.category].filter(Boolean).join(" - ") || "Sem detalhes"}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedType === "movies" && movieSearchResults.length > 0 && (
                  <div
                    data-movie-search-results
                    className="absolute left-0 right-0 top-[74px] z-20 max-h-[28rem] overflow-y-auto rounded-xl border border-white/10 bg-[#111114] p-2 shadow-2xl shadow-black/50"
                  >
                    {movieSearchResults.map((movie) => (
                      <button
                        key={`${movie.source}-${movie.mediaType}-${movie.id}`}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => void handleSelectMovie(movie)}
                        className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/[0.055]"
                      >
                        <div className="h-14 w-10 shrink-0 overflow-hidden rounded bg-white/5">
                          {movie.cover && (
                            <img
                              src={movie.cover}
                              alt={movie.title}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <strong className="block truncate text-sm text-white">
                            {movie.title}
                          </strong>
                          <span className="mt-1 block truncate font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                            {[movie.mediaType === "movie" ? "FILME" : "SERIE", movie.releaseYear, movie.category].filter(Boolean).join(" - ") || "Sem detalhes"}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedType === "books" && bookSearchResults.length > 0 && (
                  <div
                    data-book-search-results
                    className="absolute left-0 right-0 top-[74px] z-20 max-h-[28rem] overflow-y-auto rounded-xl border border-white/10 bg-[#111114] p-2 shadow-2xl shadow-black/50"
                  >
                    {bookSearchResults.map((book) => (
                      <button
                        key={`${book.source}-${book.id}`}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => void handleSelectBook(book)}
                        className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/[0.055]"
                      >
                        <div className="h-14 w-10 shrink-0 overflow-hidden rounded bg-white/5">
                          {book.cover && (
                            <img
                              src={book.cover}
                              alt={book.title}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <strong className="block truncate text-sm text-white">
                            {book.title}
                          </strong>
                          <span className="mt-1 block truncate font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                            {[book.author, book.releaseYear, book.category].filter(Boolean).join(" - ") || "Sem detalhes"}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
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
                <div className="relative flex min-h-[170px] items-center gap-4 overflow-hidden rounded-xl border border-white/10 bg-[#111114] p-4">
                  {coverBackground && (
                    <>
                      <img
                        src={coverBackground}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full scale-105 object-cover opacity-60 blur-sm"
                      />
                      <div className="absolute inset-0 bg-[#111114]/48" />
                    </>
                  )}

                  <div className="relative flex h-36 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] text-center text-[10px] leading-4 text-neutral-500 shadow-2xl shadow-black/35">
                    {coverValue ? (
                      <img
                        src={coverValue}
                        alt="Capa selecionada"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>Sem capa</span>
                    )}
                  </div>
                  <div className="relative min-w-0 flex-1">
                    <span className="mb-2 block font-mono text-[9px] uppercase tracking-widest text-neutral-500">
                      Trocar URL da capa
                    </span>
                    <input
                      placeholder="https://..."
                      {...coverInput}
                      onChange={handleCoverChange}
                      className={`${inputClass} ${errors.cover ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : ""}`}
                    />
                  </div>
                </div>
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

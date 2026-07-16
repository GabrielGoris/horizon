import { useEffect, useRef, useState } from "react";
import type { CreateMediaDTO } from "../../../../schemas/media/dto/create-media.dto";
import {
  applyBookCatalogDetails,
  getBookByIsbn,
  getBookDetails,
  searchBooks,
} from "../../../../services/bookCatalogService";
import {
  applyGameCatalogDetails,
  getGameDetails,
  getGameEnrichment,
  searchGames,
  warmGameCatalog,
} from "../../../../services/gameCatalogService";
import {
  applyMovieCatalogDetails,
  getMovieDetails,
  searchAnimes,
  searchMovies,
} from "../../../../services/movieCatalogService";
import type { BookCatalogResult, GameCatalogResult, MovieCatalogResult } from "../../../../services/types";
import type { UseMediaCatalogSearchParams } from "../../types";

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

export function useMediaCatalogSearch({ getValues, isOpen, selectedType, setValue }: UseMediaCatalogSearchParams) {
  const [gameSearchResults, setGameSearchResults] = useState<GameCatalogResult[]>([]);
  const [movieSearchResults, setMovieSearchResults] = useState<MovieCatalogResult[]>([]);
  const [bookSearchResults, setBookSearchResults] = useState<BookCatalogResult[]>([]);
  const [gameSearchError, setGameSearchError] = useState("");
  const [movieSearchError, setMovieSearchError] = useState("");
  const [bookSearchError, setBookSearchError] = useState("");
  const [bookIsbnSearchError, setBookIsbnSearchError] = useState("");
  const [coverBackdrop, setCoverBackdrop] = useState("");
  const [coverFallback, setCoverFallback] = useState("");
  const [isGameSearchLoading, setIsGameSearchLoading] = useState(false);
  const [isMovieSearchLoading, setIsMovieSearchLoading] = useState(false);
  const [isBookSearchLoading, setIsBookSearchLoading] = useState(false);
  const [isBookIsbnSearchLoading, setIsBookIsbnSearchLoading] = useState(false);
  const [isCatalogSelectionLoading, setIsCatalogSelectionLoading] = useState(false);
  const [isCampaignHoursLoading, setIsCampaignHoursLoading] = useState(false);
  const gameSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const movieSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bookSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isbnSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameSearchControllerRef = useRef<AbortController | null>(null);
  const movieSearchControllerRef = useRef<AbortController | null>(null);
  const bookSearchControllerRef = useRef<AbortController | null>(null);
  const isbnSearchControllerRef = useRef<AbortController | null>(null);
  const catalogSelectionControllerRef = useRef<AbortController | null>(null);
  const gameSearchRequestRef = useRef(0);
  const movieSearchRequestRef = useRef(0);
  const bookSearchRequestRef = useRef(0);
  const catalogSelectionRequestRef = useRef(0);

  useEffect(() => {
    if (!isOpen || selectedType !== "games") return;

    void warmGameCatalog();
  }, [isOpen, selectedType]);

  useEffect(() => () => {
    if (gameSearchTimeoutRef.current) clearTimeout(gameSearchTimeoutRef.current);
    if (movieSearchTimeoutRef.current) clearTimeout(movieSearchTimeoutRef.current);
    if (bookSearchTimeoutRef.current) clearTimeout(bookSearchTimeoutRef.current);
    if (isbnSearchTimeoutRef.current) clearTimeout(isbnSearchTimeoutRef.current);
    gameSearchControllerRef.current?.abort();
    movieSearchControllerRef.current?.abort();
    bookSearchControllerRef.current?.abort();
    isbnSearchControllerRef.current?.abort();
    catalogSelectionControllerRef.current?.abort();
  }, []);

  const fillMediaFields = (media: Partial<CreateMediaDTO>) => {
    Object.entries(media).forEach(([key, value]) => {
      setValue(key as keyof CreateMediaDTO, value ?? "", { shouldDirty: true, shouldValidate: true });
    });
  };

  const fillAvailableMediaFields = (media: Partial<CreateMediaDTO>) => {
    Object.entries(media).forEach(([key, value]) => {
      if (!String(value ?? "").trim()) return;

      setValue(key as keyof CreateMediaDTO, value ?? "", { shouldDirty: true, shouldValidate: true });
    });
  };

  const fillEmptyMediaFields = (media: Partial<CreateMediaDTO>) => {
    Object.entries(media).forEach(([key, value]) => {
      const field = key as keyof CreateMediaDTO;

      if (!String(value ?? "").trim() || String(getValues(field) ?? "").trim()) return;

      setValue(field, value ?? "", { shouldDirty: true, shouldValidate: true });
    });
  };

  const clearCatalogSearch = () => {
    if (gameSearchTimeoutRef.current) clearTimeout(gameSearchTimeoutRef.current);
    if (movieSearchTimeoutRef.current) clearTimeout(movieSearchTimeoutRef.current);
    if (bookSearchTimeoutRef.current) clearTimeout(bookSearchTimeoutRef.current);
    if (isbnSearchTimeoutRef.current) clearTimeout(isbnSearchTimeoutRef.current);
    gameSearchControllerRef.current?.abort();
    movieSearchControllerRef.current?.abort();
    bookSearchControllerRef.current?.abort();
    isbnSearchControllerRef.current?.abort();
    catalogSelectionControllerRef.current?.abort();

    gameSearchRequestRef.current += 1;
    movieSearchRequestRef.current += 1;
    bookSearchRequestRef.current += 1;
    catalogSelectionRequestRef.current += 1;
    setGameSearchResults([]);
    setMovieSearchResults([]);
    setBookSearchResults([]);
    setGameSearchError("");
    setMovieSearchError("");
    setBookSearchError("");
    setBookIsbnSearchError("");
    setCoverBackdrop("");
    setCoverFallback("");
    setIsGameSearchLoading(false);
    setIsMovieSearchLoading(false);
    setIsBookSearchLoading(false);
    setIsBookIsbnSearchLoading(false);
    setIsCatalogSelectionLoading(false);
    setIsCampaignHoursLoading(false);
  };

  const scheduleGameSearch = (query: string) => {
    const trimmedQuery = query.trim();

    if (gameSearchTimeoutRef.current) clearTimeout(gameSearchTimeoutRef.current);
    gameSearchControllerRef.current?.abort();

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
      const controller = new AbortController();
      gameSearchControllerRef.current = controller;

      searchGames(trimmedQuery, controller.signal, (results) => {
        if (requestId !== gameSearchRequestRef.current) return;

        setGameSearchResults(results);
        setGameSearchError("");
      })
        .then((results) => {
          if (requestId !== gameSearchRequestRef.current) return;

          setGameSearchResults(results);
          setGameSearchError(results.length === 0 ? "Nenhum jogo encontrado." : "");
        })
        .catch((error) => {
          if (requestId !== gameSearchRequestRef.current) return;
          if (isAbortError(error)) return;

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

    if (movieSearchTimeoutRef.current) clearTimeout(movieSearchTimeoutRef.current);
    movieSearchControllerRef.current?.abort();

    movieSearchRequestRef.current += 1;
    setMovieSearchError("");

    if ((selectedType !== "movies" && selectedType !== "animes") || trimmedQuery.length < 2) {
      setMovieSearchResults([]);
      setIsMovieSearchLoading(false);
      return;
    }

    setIsMovieSearchLoading(true);

    const requestId = movieSearchRequestRef.current;

    movieSearchTimeoutRef.current = setTimeout(() => {
      const controller = new AbortController();
      movieSearchControllerRef.current = controller;

      const searchCatalog = selectedType === "animes" ? searchAnimes : searchMovies;
      const emptySearchMessage = selectedType === "animes"
        ? "Nenhum anime encontrado."
        : "Nenhum filme ou série encontrado.";
      const searchErrorMessage = selectedType === "animes"
        ? "Erro ao buscar animes."
        : "Erro ao buscar filmes e séries.";

      searchCatalog(trimmedQuery, controller.signal)
        .then((results) => {
          if (requestId !== movieSearchRequestRef.current) return;

          setMovieSearchResults(results);
          setMovieSearchError(results.length === 0 ? emptySearchMessage : "");
        })
        .catch((error) => {
          if (requestId !== movieSearchRequestRef.current) return;
          if (isAbortError(error)) return;

          console.error(error);
          setMovieSearchResults([]);
          setMovieSearchError(error instanceof Error ? error.message : searchErrorMessage);
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

    if (bookSearchTimeoutRef.current) clearTimeout(bookSearchTimeoutRef.current);
    bookSearchControllerRef.current?.abort();

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
      const controller = new AbortController();
      bookSearchControllerRef.current = controller;

      searchBooks(trimmedQuery, controller.signal)
        .then((results) => {
          if (requestId !== bookSearchRequestRef.current) return;

          setBookSearchResults(results);
          setBookSearchError(results.length === 0 ? "Nenhum livro encontrado." : "");
        })
        .catch((error) => {
          if (requestId !== bookSearchRequestRef.current) return;
          if (isAbortError(error)) return;

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

  const searchTitle = (query: string) => {
    scheduleGameSearch(query);
    scheduleMovieSearch(query);
    scheduleBookSearch(query);
  };

  const searchCurrentTitle = (currentTitle: string) => {
    if (selectedType === "games" && currentTitle.trim().length >= 2 && gameSearchResults.length === 0) {
      scheduleGameSearch(currentTitle);
    }

    if ((selectedType === "movies" || selectedType === "animes") && currentTitle.trim().length >= 2 && movieSearchResults.length === 0) {
      scheduleMovieSearch(currentTitle);
    }

    if (selectedType === "books" && currentTitle.trim().length >= 2 && bookSearchResults.length === 0) {
      scheduleBookSearch(currentTitle);
    }
  };

  const clearResultsLater = () => {
    window.setTimeout(() => {
      if (document.activeElement?.closest("[data-game-search-results]")) return;
      if (document.activeElement?.closest("[data-movie-search-results]")) return;
      if (document.activeElement?.closest("[data-book-search-results]")) return;

      setGameSearchResults([]);
      setMovieSearchResults([]);
      setBookSearchResults([]);
    }, 120);
  };

  const handleSelectGame = async (game: GameCatalogResult) => {
    catalogSelectionControllerRef.current?.abort();
    const controller = new AbortController();
    catalogSelectionControllerRef.current = controller;
    const requestId = ++catalogSelectionRequestRef.current;

    gameSearchRequestRef.current += 1;
    setGameSearchError("");
    setGameSearchResults([]);
    setIsGameSearchLoading(false);
    setIsCampaignHoursLoading(true);
    setIsCatalogSelectionLoading(true);

    const handleCampaignHours = (campaignHours: string) => {
      if (requestId !== catalogSelectionRequestRef.current || !campaignHours) return;

      setValue("campaign_hours", campaignHours, { shouldDirty: true, shouldValidate: true });
      setIsCampaignHoursLoading(false);
    };

    const enrichmentPromise = game.source === "steam"
      ? getGameEnrichment(game, controller.signal, handleCampaignHours).catch((error) => {
          if (!isAbortError(error)) console.error(error);
          return null;
        })
      : null;

    if (enrichmentPromise) {
      void enrichmentPromise.finally(() => {
        if (requestId === catalogSelectionRequestRef.current) {
          setIsCampaignHoursLoading(false);
        }
      });
    }

    const basicGame = { ...game, creator: "", description: "", campaignHours: "" };
    const basicBackdrop = game.backdrop || game.cover;

    fillMediaFields(applyGameCatalogDetails(basicGame));
    setValue("backdrop", basicBackdrop, { shouldDirty: true, shouldValidate: true });
    setCoverBackdrop(basicBackdrop);
    setCoverFallback(game.fallbackCover || "");

    if (enrichmentPromise) {
      void enrichmentPromise.then((enrichment) => {
        if (requestId !== catalogSelectionRequestRef.current || !enrichment) return;

        fillEmptyMediaFields({
          campaign_hours: enrichment.campaignHours,
          category: enrichment.category,
          creator: enrichment.creator,
          description: enrichment.description,
          release_year: enrichment.releaseYear,
        });

        setCoverFallback(enrichment.fallbackCover || game.fallbackCover || "");
      });
    }

    try {
      const details = await getGameDetails(game, controller.signal, handleCampaignHours);
      if (requestId !== catalogSelectionRequestRef.current) return;

      const fallbackCover = details.fallbackCover || game.fallbackCover || "";
      const backdrop = details.backdrop || game.backdrop || details.cover || game.cover;

      if (details.source === "steam") {
        fillAvailableMediaFields(applyGameCatalogDetails(details));
      } else {
        fillMediaFields(applyGameCatalogDetails(details));
      }
      setValue("backdrop", backdrop, { shouldDirty: true, shouldValidate: true });
      setCoverBackdrop(backdrop);
      if (fallbackCover) setCoverFallback(fallbackCover);
      setGameSearchResults([]);
    } catch (error) {
      if (requestId !== catalogSelectionRequestRef.current) return;

      console.error(error);
      const fallbackCover = game.fallbackCover || "";
      const backdrop = game.backdrop || game.cover;

      fillMediaFields(applyGameCatalogDetails({ ...game, creator: "", description: "", campaignHours: "" }));
      setValue("backdrop", backdrop, { shouldDirty: true, shouldValidate: true });
      setCoverBackdrop(backdrop);
      setCoverFallback(fallbackCover);
      setGameSearchError("Preenchi com os dados básicos, mas não consegui carregar os detalhes.");
    } finally {
      if (requestId === catalogSelectionRequestRef.current) {
        if (!enrichmentPromise) setIsCampaignHoursLoading(false);
        setIsCatalogSelectionLoading(false);
      }
    }
  };

  const handleSelectMovie = async (movie: MovieCatalogResult) => {
    catalogSelectionControllerRef.current?.abort();
    const controller = new AbortController();
    catalogSelectionControllerRef.current = controller;
    const requestId = ++catalogSelectionRequestRef.current;

    setMovieSearchError("");
    setMovieSearchResults([]);
    setIsCampaignHoursLoading(false);
    setIsCatalogSelectionLoading(true);

    try {
      const details = await getMovieDetails(movie, controller.signal);
      if (requestId !== catalogSelectionRequestRef.current) return;

      const backdrop = details.backdrop || movie.backdrop || details.cover || movie.cover;

      fillMediaFields(applyMovieCatalogDetails(details));
      setValue("backdrop", backdrop, { shouldDirty: true, shouldValidate: true });
      setCoverBackdrop(backdrop);
      setMovieSearchResults([]);
    } catch (error) {
      if (requestId !== catalogSelectionRequestRef.current) return;

      console.error(error);
      const backdrop = movie.backdrop || movie.cover;

      fillMediaFields(applyMovieCatalogDetails({ ...movie, creator: "", director: "", description: "", runtimeMinutes: "", seasonCount: "", episodeCount: "" }));
      setValue("backdrop", backdrop, { shouldDirty: true, shouldValidate: true });
      setCoverBackdrop(backdrop);
      setMovieSearchError("Preenchi com os dados basicos, mas nao consegui carregar os detalhes.");
    } finally {
      if (requestId === catalogSelectionRequestRef.current) {
        setIsCatalogSelectionLoading(false);
      }
    }
  };

  const handleSelectBook = async (book: BookCatalogResult) => {
    catalogSelectionControllerRef.current?.abort();
    const controller = new AbortController();
    catalogSelectionControllerRef.current = controller;
    const requestId = ++catalogSelectionRequestRef.current;

    setBookSearchError("");
    setBookSearchResults([]);
    setIsCampaignHoursLoading(false);
    setIsCatalogSelectionLoading(true);

    try {
      const details = await getBookDetails(book, controller.signal);
      if (requestId !== catalogSelectionRequestRef.current) return;

      const backdrop = details.backdrop || book.backdrop || details.cover || book.cover;

      fillMediaFields(applyBookCatalogDetails(details));
      setValue("backdrop", backdrop, { shouldDirty: true, shouldValidate: true });
      setCoverBackdrop(backdrop);
      setBookSearchResults([]);
    } catch (error) {
      if (requestId !== catalogSelectionRequestRef.current) return;

      console.error(error);
      const backdrop = book.backdrop || book.cover;

      fillMediaFields(applyBookCatalogDetails({ ...book, description: "" }));
      setValue("backdrop", backdrop, { shouldDirty: true, shouldValidate: true });
      setCoverBackdrop(backdrop);
      setBookSearchError("Preenchi com os dados basicos, mas nao consegui carregar os detalhes.");
    } finally {
      if (requestId === catalogSelectionRequestRef.current) {
        setIsCatalogSelectionLoading(false);
      }
    }
  };

  const handleSelectBookByIsbn = async (isbn: string) => {
    const trimmedIsbn = isbn.trim();

    if (!trimmedIsbn) {
      setBookIsbnSearchError("Informe um ISBN para buscar a edição.");
      return;
    }

    setBookSearchError("");
    setBookIsbnSearchError("");
    setIsBookIsbnSearchLoading(true);

    try {
      const details = await getBookByIsbn(trimmedIsbn);
      const backdrop = details.backdrop || details.cover;

      fillMediaFields(applyBookCatalogDetails(details));
      setValue("isbn", trimmedIsbn, { shouldDirty: true, shouldValidate: true });
      setValue("backdrop", backdrop, { shouldDirty: true, shouldValidate: true });
      setCoverBackdrop(backdrop);
      setBookSearchResults([]);
    } catch (error) {
      console.error(error);
      setBookSearchError("");
      setBookIsbnSearchError(error instanceof Error ? error.message : "Edição não encontrada pelo ISBN.");
    } finally {
      setIsBookIsbnSearchLoading(false);
    }
  };

  const searchBookIsbn = (isbn: string) => {
    const normalizedIsbn = isbn.replace(/[^0-9Xx]/g, "");
    const compactIdentifier = isbn.replace(/[\s-]/g, "").toUpperCase();

    if (isbnSearchTimeoutRef.current) clearTimeout(isbnSearchTimeoutRef.current);
    isbnSearchControllerRef.current?.abort();

    setBookSearchError("");
    setBookIsbnSearchError("");

    if (
      selectedType === "books"
      && /^[A-Z0-9]{10}$/.test(compactIdentifier)
      && !/^\d{9}[\dX]$/.test(compactIdentifier)
    ) {
      setBookIsbnSearchError("Esse código parece ser um ASIN da Amazon. Informe o ISBN-10 ou ISBN-13 da edição.");
      return;
    }

    if (selectedType !== "books" || (normalizedIsbn.length !== 10 && normalizedIsbn.length !== 13)) {
      return;
    }

    isbnSearchTimeoutRef.current = setTimeout(() => {
      const controller = new AbortController();
      isbnSearchControllerRef.current = controller;

      setBookSearchError("");
      setBookIsbnSearchError("");
      setIsBookIsbnSearchLoading(true);
      getBookByIsbn(normalizedIsbn, controller.signal)
        .then((details) => {
          const backdrop = details.backdrop || details.cover;

          fillMediaFields(applyBookCatalogDetails(details));
          setValue("isbn", normalizedIsbn, { shouldDirty: true, shouldValidate: true });
          setValue("backdrop", backdrop, { shouldDirty: true, shouldValidate: true });
          setCoverBackdrop(backdrop);
          setBookSearchResults([]);
        })
        .catch((error) => {
          if (isAbortError(error)) return;
          console.error(error);
          setBookIsbnSearchError(error instanceof Error ? error.message : "Edicao nao encontrada pelo ISBN.");
        })
        .finally(() => {
          if (isbnSearchControllerRef.current === controller) {
            setIsBookIsbnSearchLoading(false);
          }
        });
    }, 350);
  };

  return {
    bookSearchError,
    bookIsbnSearchError,
    bookSearchResults,
    clearCatalogSearch,
    clearResultsLater,
    coverBackdrop,
    coverFallback,
    gameSearchError,
    gameSearchResults,
    handleSelectBook,
    handleSelectBookByIsbn,
    handleSelectGame,
    handleSelectMovie,
    isBookIsbnSearchLoading,
    isBookSearchLoading,
    isCampaignHoursLoading,
    isCatalogSelectionLoading,
    isGameSearchLoading,
    isMovieSearchLoading,
    movieSearchError,
    movieSearchResults,
    searchCurrentTitle,
    searchBookIsbn,
    searchTitle,
  };
}

export type MediaCatalogSearch = ReturnType<typeof useMediaCatalogSearch>;

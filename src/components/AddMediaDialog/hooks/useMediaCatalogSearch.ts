import { useRef, useState } from "react";
import type { CreateMediaDTO } from "../../../schemas/media/dto/create-media.dto";
import {
  applyBookCatalogDetails,
  getBookDetails,
  searchBooks,
} from "../../../services/bookCatalogService";
import {
  applyGameCatalogDetails,
  getGameDetails,
  searchGames,
} from "../../../services/gameCatalogService";
import {
  applyMovieCatalogDetails,
  getMovieDetails,
  searchMovies,
} from "../../../services/movieCatalogService";
import type { BookCatalogResult, GameCatalogResult, MovieCatalogResult } from "../../../services/types";
import type { UseMediaCatalogSearchParams } from "../types";

export function useMediaCatalogSearch({ selectedType, setValue }: UseMediaCatalogSearchParams) {
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

  const fillMediaFields = (media: Partial<CreateMediaDTO>) => {
    Object.entries(media).forEach(([key, value]) => {
      setValue(key as keyof CreateMediaDTO, value ?? "", { shouldDirty: true, shouldValidate: true });
    });
  };

  const clearCatalogSearch = () => {
    if (gameSearchTimeoutRef.current) clearTimeout(gameSearchTimeoutRef.current);
    if (movieSearchTimeoutRef.current) clearTimeout(movieSearchTimeoutRef.current);
    if (bookSearchTimeoutRef.current) clearTimeout(bookSearchTimeoutRef.current);

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

  const scheduleGameSearch = (query: string) => {
    const trimmedQuery = query.trim();

    if (gameSearchTimeoutRef.current) clearTimeout(gameSearchTimeoutRef.current);

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

    if (movieSearchTimeoutRef.current) clearTimeout(movieSearchTimeoutRef.current);

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

    if (bookSearchTimeoutRef.current) clearTimeout(bookSearchTimeoutRef.current);

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

  const searchTitle = (query: string) => {
    scheduleGameSearch(query);
    scheduleMovieSearch(query);
    scheduleBookSearch(query);
  };

  const searchCurrentTitle = (currentTitle: string) => {
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

      fillMediaFields(applyGameCatalogDetails({ ...game, creator: "", description: "", campaignHours: "" }));
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

      fillMediaFields(applyMovieCatalogDetails({ ...movie, creator: "", director: "", description: "", runtimeMinutes: "", seasonCount: "", episodeCount: "" }));
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

  return {
    bookSearchError,
    bookSearchResults,
    clearCatalogSearch,
    clearResultsLater,
    coverBackdrop,
    gameSearchError,
    gameSearchResults,
    handleSelectBook,
    handleSelectGame,
    handleSelectMovie,
    isBookSearchLoading,
    isGameSearchLoading,
    isMovieSearchLoading,
    movieSearchError,
    movieSearchResults,
    searchCurrentTitle,
    searchTitle,
  };
}

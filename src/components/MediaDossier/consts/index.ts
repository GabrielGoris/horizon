import type { MediaStatus, MediaType } from "../../../types";

export const typeLabels: Record<MediaType, string> = {
  games: "Jogo",
  movies: "Filme",
  books: "Livro",
};

export const statusLabels: Record<MediaStatus, string> = {
  complete: "Completo",
  new: "Recente",
  queue: "Fila",
  reading: "Em andamento",
};

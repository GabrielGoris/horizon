import type { MediaStatus, MediaType } from "../../../types";
import { mediaStatusLabels } from "../../../consts/mediaStatus";

export const typeLabels: Record<MediaType, string> = {
  games: "Jogo",
  movies: "Filme",
  books: "Livro",
};

export const statusLabels: Record<MediaStatus, string> = mediaStatusLabels;

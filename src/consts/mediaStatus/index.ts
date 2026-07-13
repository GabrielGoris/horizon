import type { MediaStatus, MediaType } from "../../types";

export const MEDIA_STATUS_OPTIONS: MediaStatus[] = ["queue", "in_progress", "dropped", "complete"];

export const mediaStatusLabels: Record<MediaStatus, string> = {
  complete: "Finalizado",
  dropped: "Dropado",
  in_progress: "Em andamento",
  queue: "Na fila",
};

export const mediaStatusLabelsByType: Record<MediaType, Record<MediaStatus, string>> = {
  games: {
    complete: "Finalizado",
    dropped: "Dropado",
    in_progress: "Jogando",
    queue: "Na fila",
  },
  movies: {
    complete: "Assistido",
    dropped: "Dropado",
    in_progress: "Assistindo",
    queue: "Na fila",
  },
  books: {
    complete: "Lido",
    dropped: "Dropado",
    in_progress: "Lendo",
    queue: "Na fila",
  },
};

export function getMediaStatusLabel(status: MediaStatus, type?: MediaType) {
  if (!type) return mediaStatusLabels[status];

  return mediaStatusLabelsByType[type][status];
}

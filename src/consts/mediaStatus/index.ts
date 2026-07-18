import type { BaseMediaStatus, MediaFormat, MediaStatus, MediaType } from "../../types";

const BASE_MEDIA_STATUS_OPTIONS: BaseMediaStatus[] = ["queue", "in_progress", "dropped", "complete"];

export const mediaStatusLabels: Record<MediaStatus, string> = {
  complete: "Finalizado",
  dropped: "Dropado",
  incomplete: "Incompleto",
  in_progress: "Em andamento",
  queue: "Na fila",
  want_to_buy: "Quero comprar",
};

export const mediaStatusLabelsByType: Record<MediaType, Record<MediaStatus, string>> = {
  animes: {
    complete: "Assistido",
    dropped: "Dropado",
    incomplete: "Incompleto",
    in_progress: "Assistindo",
    queue: "Na fila",
    want_to_buy: "Quero comprar",
  },
  games: {
    complete: "Finalizado",
    dropped: "Dropado",
    incomplete: "Incompleto",
    in_progress: "Jogando",
    queue: "Na fila",
    want_to_buy: "Quero comprar",
  },
  movies: {
    complete: "Assistido",
    dropped: "Dropado",
    incomplete: "Incompleto",
    in_progress: "Assistindo",
    queue: "Na fila",
    want_to_buy: "Quero comprar",
  },
  books: {
    complete: "Lido",
    dropped: "Dropado",
    incomplete: "Incompleto",
    in_progress: "Lendo",
    queue: "Na fila",
    want_to_buy: "Quero comprar",
  },
};

export function getMediaStatusLabel(status: MediaStatus, type?: MediaType) {
  if (!type) return mediaStatusLabels[status];

  return mediaStatusLabelsByType[type][status];
}

export function getMediaStatusOptions(type?: MediaType, mediaFormat?: MediaFormat): MediaStatus[] {
  if (type === "books") return ["want_to_buy", ...BASE_MEDIA_STATUS_OPTIONS] satisfies MediaStatus[];

  const supportsIncomplete = type === "animes" || (type === "movies" && mediaFormat !== "movie");
  if (!supportsIncomplete) return BASE_MEDIA_STATUS_OPTIONS;

  return ["queue", "in_progress", "incomplete", "dropped", "complete"] satisfies MediaStatus[];
}

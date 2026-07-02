import type { MediaItem } from "../../../types";

export function formatAuthorLine(item: MediaItem) {
  const creator = item.creator || "Autor desconhecido";
  const year = item.releaseYear ? ` - ${item.releaseYear}` : "";

  return `Por ${creator}${year}`;
}

export function formatTicketDate(date: string) {
  if (!date) return "Sem data";

  const ticketDate = new Date(`${date}T00:00:00`);
  const day = String(ticketDate.getDate()).padStart(2, "0");
  const month = new Intl.DateTimeFormat("pt-BR", { month: "short" })
    .format(ticketDate)
    .replace(".", "");
  const year = ticketDate.getFullYear();

  return `${day}/${month}/${year}`;
}

export function getInitialWatchedDate(item: MediaItem) {
  const storedDate = item.watched_at || item.completed_at;

  if (storedDate) return storedDate.slice(0, 10);

  return new Date().toISOString().slice(0, 10);
}

export function getNumericRating(rating: string) {
  const value = Number.parseFloat(rating);

  if (!Number.isFinite(value)) return 0;

  const clampedValue = Math.min(5, Math.max(0, value));

  return Math.round(clampedValue * 2) / 2;
}

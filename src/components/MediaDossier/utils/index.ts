import type { MediaItem } from "../../../types";
import { getDateInputValue } from "../../../utils/date";

export { formatDateInput, formatTicketDate } from "../../../utils/date";

export function formatAuthorLine(item: MediaItem) {
  const creator = item.creator || "Autor desconhecido";
  const year = item.releaseYear ? ` - ${item.releaseYear}` : "";

  return `Por ${creator}${year}`;
}

export function getInitialWatchedDate(item: MediaItem) {
  return getDateInputValue(item.watched_at || item.completed_at);
}

export function getNumericRating(rating: string) {
  const value = Number.parseFloat(rating);

  if (!Number.isFinite(value)) return 0;

  const clampedValue = Math.min(5, Math.max(0, value));

  return Math.round(clampedValue * 2) / 2;
}

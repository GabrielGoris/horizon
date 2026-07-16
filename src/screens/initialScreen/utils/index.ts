import type { MediaItem } from "../../../types";
import type { SortMode } from "../types";

const ESTIMATED_EPISODE_MINUTES = 45;
const ESTIMATED_EPISODES_PER_SEASON = 10;

export function getYear(value?: string | number) {
  if (value === undefined || value === null || value === "") return "";

  return String(value).slice(0, 4);
}

export function getCompletionYear(item: MediaItem) {
  return String(item.completed_year || getYear(item.watched_at) || getYear(item.completed_at));
}

export function isSeriesItem(item: MediaItem) {
  return (item.type === "movies" || item.type === "animes") && item.media_format === "series";
}

function getNumericValue(value?: string | number) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getRatingValue(item: MediaItem) {
  const rating = Number(item.rating);

  return Number.isFinite(rating) && rating > 0 ? rating : null;
}

function getPrioritySortValue(item: MediaItem) {
  const position = Number(item.wishlist_position);

  return Number.isFinite(position) && position > 0 ? position : Number.POSITIVE_INFINITY;
}

function getDurationMinutes(value?: string | number, numericUnit: "hours" | "minutes" = "minutes") {
  if (typeof value === "number") {
    return numericUnit === "hours" ? value * 60 : value;
  }

  if (!value?.trim()) return 0;

  const normalizedValue = value.toLowerCase().replace(",", ".").trim();
  const hourMatch = normalizedValue.match(/(\d+(?:\.\d+)?)\s*h/);
  const minuteMatch = normalizedValue.match(/(\d+(?:\.\d+)?)\s*(?:m|min)/);

  if (hourMatch || minuteMatch) {
    const hours = hourMatch ? Number(hourMatch[1]) : 0;
    const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;

    return hours * 60 + minutes;
  }

  const numberValue = Number(normalizedValue);

  if (!Number.isFinite(numberValue)) return 0;

  return numericUnit === "hours" ? numberValue * 60 : numberValue;
}

function getRuntimeMinutes(item: MediaItem) {
  if (isSeriesItem(item)) {
    const episodeCount = getNumericValue(item.episode_count);
    const seasonCount = getNumericValue(item.season_count);

    return (episodeCount || seasonCount * ESTIMATED_EPISODES_PER_SEASON) * ESTIMATED_EPISODE_MINUTES;
  }

  return getDurationMinutes(item.runtime_minutes);
}

export function sortMediaItems(items: MediaItem[], sortMode: SortMode) {
  return [...items].sort((firstItem, secondItem) => {
    if (sortMode === "title_asc" || sortMode === "title_desc") {
      const comparison = firstItem.title.localeCompare(secondItem.title, "pt-BR", {
        numeric: true,
        sensitivity: "base",
      });

      return sortMode === "title_asc" ? comparison : -comparison;
    }

    if (sortMode === "rating_asc") {
      return (getRatingValue(firstItem) ?? Number.POSITIVE_INFINITY) - (getRatingValue(secondItem) ?? Number.POSITIVE_INFINITY);
    }

    if (sortMode === "rating_desc") {
      return (getRatingValue(secondItem) ?? -1) - (getRatingValue(firstItem) ?? -1);
    }

    if (sortMode === "campaign_asc") {
      return getDurationMinutes(firstItem.campaign_hours, "hours") - getDurationMinutes(secondItem.campaign_hours, "hours");
    }

    if (sortMode === "campaign_desc") {
      return getDurationMinutes(secondItem.campaign_hours, "hours") - getDurationMinutes(firstItem.campaign_hours, "hours");
    }

    if (sortMode === "runtime_asc") {
      return getRuntimeMinutes(firstItem) - getRuntimeMinutes(secondItem);
    }

    if (sortMode === "runtime_desc") {
      return getRuntimeMinutes(secondItem) - getRuntimeMinutes(firstItem);
    }

    if (sortMode === "pages_asc") {
      return getNumericValue(firstItem.page_count) - getNumericValue(secondItem.page_count);
    }

    if (sortMode === "pages_desc") {
      return getNumericValue(secondItem.page_count) - getNumericValue(firstItem.page_count);
    }

    return firstItem.title.localeCompare(secondItem.title, "pt-BR", {
      numeric: true,
      sensitivity: "base",
    });
  });
}

export function sortMediaItemsByPriority(items: MediaItem[]) {
  return [...items].sort(
    (firstItem, secondItem) => getPrioritySortValue(firstItem) - getPrioritySortValue(secondItem)
  );
}

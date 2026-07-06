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
  return item.type === "movies" && item.movie_kind === "series";
}

function getNumericValue(value?: string | number) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
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

    return getYear(secondItem.added_at).localeCompare(getYear(firstItem.added_at));
  });
}

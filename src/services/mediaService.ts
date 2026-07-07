import { supabase } from "../lib/supabase";
import type { BookCompletionDTO } from "../schemas/media/dto/book-completion.dto";
import type { CreateMediaDTO } from "../schemas/media/dto/create-media.dto";
import type { GameCompletionDTO } from "../schemas/media/dto/game-completion.dto";
import type { MovieTicketDTO } from "../schemas/media/dto/movie-ticket.dto";
import type { MediaItem, MediaItemRow } from "../types";
import { toSupabaseDate } from "../utils/date";



function getCompletion<T>(completion: T[] | T | null | undefined) {
  if (Array.isArray(completion)) return completion[0];

  return completion;
}

function formatRating(rating: number | string | null | undefined) {
  if (rating === null || rating === undefined || rating === "") return "";

  return String(rating);
}

function toNullableNumber(value: string | number | undefined) {
  if (value === undefined || value === "") return null;

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function parseDurationMinutes(value: string | number | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (!value?.trim()) return null;

  const normalizedValue = value.toLowerCase().replace(",", ".").trim();
  const hourMatch = normalizedValue.match(/(\d+(?:\.\d+)?)\s*h/);
  const minuteMatch = normalizedValue.match(/(\d+(?:\.\d+)?)\s*(?:m|min)/);

  if (hourMatch || minuteMatch) {
    const hours = hourMatch ? Number(hourMatch[1]) : 0;
    const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
    const totalMinutes = hours * 60 + minutes;

    return Number.isFinite(totalMinutes) ? Math.round(totalMinutes) : null;
  }

  return toNullableNumber(normalizedValue);
}

function parseDurationHours(value: string | number | undefined) {
  const totalMinutes = parseDurationMinutes(value);

  if (totalMinutes === null) return null;

  if (typeof value === "string" && /(?:h|m|min)/i.test(value)) {
    const hours = totalMinutes / 60;

    return Number.isFinite(hours) ? Number(hours.toFixed(2)) : null;
  }

  return totalMinutes;
}

function toNullableText(value: string | undefined) {
  const trimmedValue = value?.trim();

  return trimmedValue ? trimmedValue : null;
}

function getCreateMediaPayload(data: CreateMediaDTO) {
  return {
    title: data.title,
    type: data.type,
    movie_kind: data.type === "movies" ? data.movie_kind ?? "movie" : null,
    status: data.status,
    creator: toNullableText(data.creator),
    director: toNullableText(data.director),
    category: toNullableText(data.category),
    cover: toNullableText(data.cover),
    backdrop: toNullableText(data.backdrop),
    release_year: toNullableText(data.release_year),
    added_at: toSupabaseDate(data.added_at),
    completed_year: toNullableNumber(data.completed_year),
    page_count: toNullableNumber(data.page_count),
    runtime_minutes: parseDurationMinutes(data.runtime_minutes),
    season_count: toNullableNumber(data.season_count),
    episode_count: toNullableNumber(data.episode_count),
    campaign_hours: parseDurationHours(data.campaign_hours),
    meta: toNullableText(data.meta),
    description: toNullableText(data.description),
  };
}

function normalizeMediaItem(item: MediaItemRow): MediaItem {
  const movieCompletion = getCompletion(item.movie_completions);
  const bookCompletion = getCompletion(item.book_completions);
  const gameCompletion = getCompletion(item.game_completions);
  const completion = movieCompletion || bookCompletion || gameCompletion;

  return {
    id: item.id,
    title: item.title,
    creator: item.creator ?? "",
    director: item.director ?? "",
    category: item.category ?? "",
    cover: item.cover ?? "",
    backdrop: item.backdrop ?? "",
    type: item.type,
    movie_kind: item.movie_kind ?? undefined,
    status: item.status,
    releaseYear: item.release_year ?? "",
    meta: item.meta ?? "",
    rating: formatRating(completion?.rating ?? item.rating),
    description: item.description ?? "",
    added_at: item.added_at ?? undefined,
    completed_year: item.completed_year ?? undefined,
    watched_at: movieCompletion?.watched_at ?? undefined,
    completed_at: bookCompletion?.finished_at ?? gameCompletion?.finished_at ?? undefined,
    page_count: item.page_count ?? undefined,
    runtime_minutes: item.runtime_minutes ?? undefined,
    season_count: item.season_count ?? undefined,
    episode_count: item.episode_count ?? undefined,
    campaign_hours: item.campaign_hours ?? undefined,
    wishlist_position: item.wishlist_position ?? undefined,
    wishlist_added_at: item.wishlist_added_at ?? undefined,
    pages: bookCompletion?.pages ?? undefined,
    hours_played: gameCompletion?.hours_played ?? undefined,
    completion_type: gameCompletion?.completion_type ?? undefined,
    progress: item.progress,
  };
}

export async function fetchMedia() {
  const { data, error } = await supabase
    .from("media_items")
    .select("*, movie_completions(*), book_completions(*), game_completions(*)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((item) => normalizeMediaItem(item as MediaItemRow));
}

export async function createMedia(data: CreateMediaDTO) {
  const { data: createdMedia, error } = await supabase
    .from("media_items")
    .insert([getCreateMediaPayload(data)])
    .select("*")
    .single();

  if (error) throw error;

  const watchedAt = toSupabaseDate(data.watched_at);

  if (data.type === "movies" && data.status === "complete" && watchedAt && createdMedia?.id) {
    await saveMovieTicket(createdMedia.id, { watchedAt, rating: "" });
  }

  return createdMedia ? normalizeMediaItem(createdMedia as MediaItemRow) : null;
}

export async function completeMedia(itemId: string) {
  const { error } = await supabase
    .from("media_items")
    .update({ status: "complete", completed_year: new Date().getFullYear() })
    .eq("id", itemId);

  if (error) throw error;
}

export async function deleteMedia(itemId: string) {
  const { error } = await supabase
    .from("media_items")
    .delete()
    .eq("id", itemId);

  if (error) throw error;
}

export async function saveMovieTicket(itemId: string, ticket: MovieTicketDTO) {
  const { error } = await supabase.from("movie_completions").upsert(
    {
      media_item_id: itemId,
      watched_at: toSupabaseDate(ticket.watchedAt),
      rating: toNullableNumber(ticket.rating),
    },
    { onConflict: "media_item_id" }
  );

  if (error) throw error;
}

export async function saveBookCompletion(itemId: string, completion: BookCompletionDTO) {
  const { error } = await supabase.from("book_completions").upsert(
    {
      media_item_id: itemId,
      finished_at: completion.finishedAt,
      rating: toNullableNumber(completion.rating),
      pages: toNullableNumber(completion.pages),
    },
    { onConflict: "media_item_id" }
  );

  if (error) throw error;
}

export async function saveGameCompletion(itemId: string, completion: GameCompletionDTO) {
  const { error } = await supabase.from("game_completions").upsert(
    {
      media_item_id: itemId,
      finished_at: completion.finishedAt,
      rating: toNullableNumber(completion.rating),
      hours_played: toNullableNumber(completion.hoursPlayed),
      completion_type: completion.completionType || null,
    },
    { onConflict: "media_item_id" }
  );

  if (error) throw error;
}

export function markMediaAsComplete(item: MediaItem): MediaItem {
  return {
    ...item,
    status: "complete",
    completed_at: new Date().toISOString(),
    completed_year: new Date().getFullYear(),
  };
}

export function applyMovieTicket(item: MediaItem, ticket: MovieTicketDTO): MediaItem {
  return {
    ...item,
    rating: ticket.rating,
    watched_at: ticket.watchedAt,
  };
}

export function applyBookCompletion(item: MediaItem, completion: BookCompletionDTO): MediaItem {
  return {
    ...item,
    rating: completion.rating,
    completed_at: completion.finishedAt,
    pages: completion.pages,
  };
}

export function applyGameCompletion(item: MediaItem, completion: GameCompletionDTO): MediaItem {
  return {
    ...item,
    rating: completion.rating,
    completed_at: completion.finishedAt,
    hours_played: completion.hoursPlayed,
    completion_type: completion.completionType,
  };
}

import { supabase } from "../../lib/supabase";
import type { AudiovisualCompletionDTO } from "../../schemas/media/dto/audiovisual-completion.dto";
import type { BookCompletionDTO } from "../../schemas/media/dto/book-completion.dto";
import type { CreateMediaDTO } from "../../schemas/media/dto/create-media.dto";
import type { GameCompletionDTO } from "../../schemas/media/dto/game-completion.dto";
import type { UpdateMediaDetailsDTO } from "../../schemas/media/dto/update-media.dto";
import type { MediaItem, MediaItemRow } from "../../types";
import { toSupabaseDate } from "../../utils/date";
import { isSameMedia } from "./helpers";
import type { ExistingMediaIdentity } from "./types";

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

export async function hasDuplicateMedia(data: CreateMediaDTO) {
  const userId = await getCurrentUserId();
  const { data: existingItems, error } = await supabase
    .from("media_items")
    .select("title, release_year, meta, media_format, creator")
    .eq("user_id", userId)
    .eq("type", data.type);

  if (error) throw error;

  return (existingItems ?? []).some((item) => isSameMedia(item as ExistingMediaIdentity, data));
}

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error("Usuário não autenticado.");
  }

  return data.user.id;
}

function getCreateMediaPayload(data: CreateMediaDTO, userId: string) {
  return {
    user_id: userId,
    title: data.title,
    type: data.type,
    media_format: data.type === "movies" || data.type === "animes" ? data.media_format ?? "movie" : null,
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
  const audiovisualCompletion = getCompletion(item.audiovisual_completions);
  const bookCompletion = getCompletion(item.book_completions);
  const gameCompletion = getCompletion(item.game_completions);
  const completion = audiovisualCompletion || bookCompletion || gameCompletion;

  return {
    id: item.id,
    user_id: item.user_id ?? undefined,
    external_id: item.external_id ?? undefined,
    source: item.source ?? undefined,
    title: item.title,
    creator: item.creator ?? "",
    director: item.director ?? "",
    category: item.category ?? "",
    cover: item.cover ?? "",
    backdrop: item.backdrop ?? "",
    type: item.type,
    media_format: item.media_format ?? undefined,
    status: item.status,
    releaseYear: item.release_year ?? "",
    meta: item.meta ?? "",
    rating: formatRating(completion?.rating ?? item.rating),
    description: item.description ?? "",
    added_at: item.added_at ?? undefined,
    completed_year: item.completed_year ?? undefined,
    watched_at: audiovisualCompletion?.watched_at ?? undefined,
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
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("media_items")
    .select("*, audiovisual_completions(*), book_completions(*), game_completions(*)")
    .eq("user_id", userId)
    .is("hidden_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((item) => normalizeMediaItem(item as MediaItemRow));
}

export async function fetchMediaItem(identity: {
  externalId?: string;
  id?: string;
  source?: string;
}) {
  const userId = await getCurrentUserId();
  let query = supabase
    .from("media_items")
    .select("*, audiovisual_completions(*), book_completions(*), game_completions(*)")
    .eq("user_id", userId)
    .is("hidden_at", null);

  if (identity.id) {
    query = query.eq("id", identity.id);
  } else {
    query = query
      .eq("source", identity.source ?? "steam")
      .eq("external_id", identity.externalId ?? "");
  }

  const { data, error } = await query.maybeSingle();

  if (error) throw error;

  return data ? normalizeMediaItem(data as MediaItemRow) : null;
}

export async function createMedia(data: CreateMediaDTO) {
  const userId = await getCurrentUserId();
  const { data: createdMedia, error } = await supabase
    .from("media_items")
    .insert([getCreateMediaPayload(data, userId)])
    .select("*")
    .single();

  if (error) throw error;

  const completionRating = data.rating ?? "";

  if ((data.type === "movies" || data.type === "animes") && data.status === "complete" && createdMedia?.id) {
    await saveAudiovisualCompletion(createdMedia.id, { watchedAt: data.watched_at ?? "", rating: completionRating });
  }

  if (data.type === "books" && data.status === "complete" && createdMedia?.id) {
    await saveBookCompletion(createdMedia.id, {
      finishedAt: data.completed_year ?? "",
      rating: completionRating,
      pages: data.page_count,
    });
  }

  if (data.type === "games" && data.status === "complete" && createdMedia?.id) {
    await saveGameCompletion(createdMedia.id, {
      finishedAt: data.completed_year ?? "",
      rating: completionRating,
      completionType: "Campanha",
    });
  }

  return createdMedia ? normalizeMediaItem(createdMedia as MediaItemRow) : null;
}

export async function completeMedia(itemId: string) {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("media_items")
    .update({ status: "complete", completed_year: new Date().getFullYear() })
    .eq("id", itemId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function updateMediaStatus(itemId: string, status: MediaItem["status"]) {
  const userId = await getCurrentUserId();
  const payload = status === "complete"
    ? { status, completed_year: new Date().getFullYear() }
    : { status, completed_year: null };

  const { error } = await supabase
    .from("media_items")
    .update(payload)
    .eq("id", itemId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function updateMediaMeta(itemId: string, meta: string) {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("media_items")
    .update({ meta: toNullableText(meta) })
    .eq("id", itemId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function updateMediaDetails(itemId: string, details: UpdateMediaDetailsDTO) {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("media_items")
    .update({
      title: details.title.trim(),
      creator: toNullableText(details.creator),
      director: toNullableText(details.director),
      category: toNullableText(details.category),
      cover: toNullableText(details.cover),
      backdrop: toNullableText(details.backdrop),
      release_year: toNullableText(details.release_year),
      campaign_hours: parseDurationHours(details.campaign_hours),
      description: toNullableText(details.description),
    })
    .eq("id", itemId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteMedia(item: MediaItem) {
  const userId = await getCurrentUserId();
  const query = supabase.from("media_items");
  const { error } = item.source === "steam" && item.external_id
    ? await query
      .update({ hidden_at: new Date().toISOString() })
      .eq("id", item.id)
      .eq("user_id", userId)
    : await query
      .delete()
      .eq("id", item.id)
      .eq("user_id", userId);

  if (error) throw error;
}

export async function saveAudiovisualCompletion(itemId: string, completion: AudiovisualCompletionDTO) {
  const { error } = await supabase.from("audiovisual_completions").upsert(
    {
      media_item_id: itemId,
      watched_at: toSupabaseDate(completion.watchedAt),
      rating: toNullableNumber(completion.rating),
    },
    { onConflict: "media_item_id" }
  );

  if (error) throw error;
}

export async function saveBookCompletion(itemId: string, completion: BookCompletionDTO) {
  const { error } = await supabase.from("book_completions").upsert(
    {
      media_item_id: itemId,
      finished_at: toSupabaseDate(completion.finishedAt),
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
      finished_at: toSupabaseDate(completion.finishedAt),
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

export function applyAudiovisualCompletion(item: MediaItem, completion: AudiovisualCompletionDTO): MediaItem {
  return {
    ...item,
    rating: completion.rating,
    watched_at: completion.watchedAt,
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

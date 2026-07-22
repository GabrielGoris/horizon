import { supabase } from "../../lib/supabase";
import {
  enqueueOfflineOperation,
  getQueuedOperations,
  isNetworkAvailable,
  readCachedMedia,
  removeQueuedOperation,
  updateCachedMedia,
  writeCachedMedia,
} from "../offlineStore";
import type { AudiovisualCompletionDTO } from "../../schemas/media/dto/audiovisual-completion.dto";
import type { BookCompletionDTO } from "../../schemas/media/dto/book-completion.dto";
import type { CreateMediaDTO } from "../../schemas/media/dto/create-media.dto";
import type { GameCompletionDTO } from "../../schemas/media/dto/game-completion.dto";
import type { UpdateMediaDetailsDTO } from "../../schemas/media/dto/update-media.dto";
import type { BaseMediaStatus, MediaItem, MediaItemRow, MediaStatus, MediaStatusDetail } from "../../types";
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

function getPersistedMediaStatus(status: MediaStatus): {
  status: BaseMediaStatus;
  status_detail: MediaStatusDetail | null;
} {
  if (status === "incomplete") return { status: "in_progress", status_detail: status };
  if (status === "want_to_buy") return { status: "queue", status_detail: status };

  return { status, status_detail: null };
}

export async function hasDuplicateMedia(data: CreateMediaDTO) {
  const userId = await getCurrentUserId();

  if (!isNetworkAvailable()) {
    const cachedMedia = await readCachedMedia(userId);
    return cachedMedia.some((item) => isSameMedia(item as unknown as ExistingMediaIdentity, data));
  }

  const { data: existingItems, error } = await supabase
    .from("media_items")
    .select("title, release_year, meta, media_format, creator")
    .eq("user_id", userId)
    .eq("type", data.type);

  if (error) throw error;

  return (existingItems ?? []).some((item) => isSameMedia(item as ExistingMediaIdentity, data));
}

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session?.user) {
    throw new Error("Usuário não autenticado.");
  }

  return data.session.user.id;
}

function getCreateMediaPayload(data: CreateMediaDTO, userId: string, id?: string) {
  const persistedStatus = getPersistedMediaStatus(data.status);

  return {
    ...(id ? { id } : {}),
    user_id: userId,
    title: data.title,
    type: data.type,
    media_format: data.type === "movies" || data.type === "animes" ? data.media_format ?? "movie" : null,
    ...persistedStatus,
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
    status: item.status_detail ?? item.status,
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

async function fetchRemoteMedia() {
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

async function createRemoteMedia(data: CreateMediaDTO, id?: string) {
  const userId = await getCurrentUserId();
  const { data: createdMedia, error } = await supabase
    .from("media_items")
    .insert([getCreateMediaPayload(data, userId, id)])
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

async function completeRemoteMedia(itemId: string) {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("media_items")
    .update({ status: "complete", status_detail: null, completed_year: new Date().getFullYear() })
    .eq("id", itemId)
    .eq("user_id", userId);

  if (error) throw error;
}

async function updateRemoteMediaStatus(itemId: string, status: MediaItem["status"]) {
  const userId = await getCurrentUserId();
  const persistedStatus = getPersistedMediaStatus(status);
  const payload = status === "complete"
    ? { ...persistedStatus, completed_year: new Date().getFullYear() }
    : { ...persistedStatus, completed_year: null };

  const { error } = await supabase
    .from("media_items")
    .update(payload)
    .eq("id", itemId)
    .eq("user_id", userId);

  if (error) throw error;
}

async function updateRemoteMediaMeta(itemId: string, meta: string) {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("media_items")
    .update({ meta: toNullableText(meta) })
    .eq("id", itemId)
    .eq("user_id", userId);

  if (error) throw error;
}

async function updateRemoteMediaDetails(itemId: string, details: UpdateMediaDetailsDTO) {
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

async function deleteRemoteMedia(item: MediaItem) {
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

async function saveRemoteAudiovisualCompletion(itemId: string, completion: AudiovisualCompletionDTO) {
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

async function saveRemoteBookCompletion(itemId: string, completion: BookCompletionDTO) {
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

async function saveRemoteGameCompletion(itemId: string, completion: GameCompletionDTO) {
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

function createLocalMedia(data: CreateMediaDTO, userId: string, id: string = crypto.randomUUID()): MediaItem {
  const isComplete = data.status === "complete";
  const completedAt = isComplete ? String(data.completed_year ?? new Date().getFullYear()) : undefined;

  return {
    id,
    user_id: userId,
    title: data.title.trim(),
    type: data.type,
    media_format: data.type === "movies" || data.type === "animes" ? data.media_format ?? "movie" : undefined,
    status: data.status,
    creator: data.creator ?? "",
    director: data.director ?? "",
    category: data.category ?? "",
    cover: data.cover ?? "",
    backdrop: data.backdrop ?? "",
    releaseYear: data.release_year ?? "",
    meta: data.meta ?? "",
    rating: data.rating ?? "",
    description: data.description ?? "",
    added_at: data.added_at,
    completed_year: isComplete ? data.completed_year ?? new Date().getFullYear() : undefined,
    watched_at: data.type === "movies" || data.type === "animes" ? data.watched_at : undefined,
    completed_at: data.type === "books" || data.type === "games" ? completedAt : undefined,
    page_count: data.page_count,
    runtime_minutes: data.runtime_minutes,
    season_count: data.season_count,
    episode_count: data.episode_count,
    campaign_hours: data.campaign_hours,
    pages: data.type === "books" && isComplete ? data.page_count : undefined,
    completion_type: data.type === "games" && isComplete ? "Campanha" : undefined,
  };
}

async function mutateCachedItem(userId: string, itemId: string, update: (item: MediaItem) => MediaItem) {
  await updateCachedMedia(userId, (items) => items.map((item) => (item.id === itemId ? update(item) : item)));
}

export async function syncOfflineMediaChanges() {
  if (!isNetworkAvailable()) return false;

  const userId = await getCurrentUserId();
  const operations = await getQueuedOperations(userId);

  for (const operation of operations) {
    switch (operation.kind) {
      case "create": {
        const payload = operation.payload as { data: CreateMediaDTO; id: string };
        await createRemoteMedia(payload.data, payload.id);
        break;
      }
      case "complete":
        await completeRemoteMedia(operation.mediaId);
        break;
      case "status":
        await updateRemoteMediaStatus(operation.mediaId, operation.payload as MediaItem["status"]);
        break;
      case "meta":
        await updateRemoteMediaMeta(operation.mediaId, operation.payload as string);
        break;
      case "details":
        await updateRemoteMediaDetails(operation.mediaId, operation.payload as UpdateMediaDetailsDTO);
        break;
      case "delete":
        await deleteRemoteMedia(operation.payload as MediaItem);
        break;
      case "audiovisual-completion":
        await saveRemoteAudiovisualCompletion(operation.mediaId, operation.payload as AudiovisualCompletionDTO);
        break;
      case "book-completion":
        await saveRemoteBookCompletion(operation.mediaId, operation.payload as BookCompletionDTO);
        break;
      case "game-completion":
        await saveRemoteGameCompletion(operation.mediaId, operation.payload as GameCompletionDTO);
        break;
    }

    if (operation.id !== undefined) await removeQueuedOperation(operation.id);
  }

  return operations.length > 0;
}

export async function fetchMedia() {
  const userId = await getCurrentUserId();
  const cachedMedia = await readCachedMedia(userId);

  if (!isNetworkAvailable()) return cachedMedia;

  try {
    await syncOfflineMediaChanges();
    const remoteMedia = await fetchRemoteMedia();
    await writeCachedMedia(userId, remoteMedia);
    return remoteMedia;
  } catch (error) {
    if (cachedMedia.length > 0 || !isNetworkAvailable()) return cachedMedia;
    throw error;
  }
}

export async function fetchCachedMedia() {
  const userId = await getCurrentUserId();
  return readCachedMedia(userId);
}

export async function createMedia(data: CreateMediaDTO) {
  const userId = await getCurrentUserId();

  if (!isNetworkAvailable()) {
    const localMedia = createLocalMedia(data, userId);
    await updateCachedMedia(userId, (items) => [localMedia, ...items]);
    await enqueueOfflineOperation(userId, { kind: "create", mediaId: localMedia.id, payload: { data, id: localMedia.id } });
    return localMedia;
  }

  const createdMedia = await createRemoteMedia(data);
  if (createdMedia) {
    const cachedMedia = createLocalMedia(data, userId, createdMedia.id);
    await updateCachedMedia(userId, (items) => [cachedMedia, ...items.filter((item) => item.id !== createdMedia.id)]);
  }
  return createdMedia;
}

export async function completeMedia(itemId: string) {
  const userId = await getCurrentUserId();
  await mutateCachedItem(userId, itemId, markMediaAsComplete);

  if (!isNetworkAvailable()) {
    await enqueueOfflineOperation(userId, { kind: "complete", mediaId: itemId });
    return;
  }

  await completeRemoteMedia(itemId);
}

export async function updateMediaStatus(itemId: string, status: MediaItem["status"]) {
  const userId = await getCurrentUserId();
  await mutateCachedItem(userId, itemId, (item) => status === "complete" ? markMediaAsComplete(item) : { ...item, status, completed_year: undefined });

  if (!isNetworkAvailable()) {
    await enqueueOfflineOperation(userId, { kind: "status", mediaId: itemId, payload: status });
    return;
  }

  await updateRemoteMediaStatus(itemId, status);
}

export async function updateMediaMeta(itemId: string, meta: string) {
  const userId = await getCurrentUserId();
  await mutateCachedItem(userId, itemId, (item) => ({ ...item, meta }));

  if (!isNetworkAvailable()) {
    await enqueueOfflineOperation(userId, { kind: "meta", mediaId: itemId, payload: meta });
    return;
  }

  await updateRemoteMediaMeta(itemId, meta);
}

export async function updateMediaDetails(itemId: string, details: UpdateMediaDetailsDTO) {
  const userId = await getCurrentUserId();
  await mutateCachedItem(userId, itemId, (item) => ({
    ...item,
    title: details.title.trim(),
    creator: details.creator ?? "",
    director: details.director ?? "",
    category: details.category ?? "",
    cover: details.cover ?? "",
    backdrop: details.backdrop ?? "",
    releaseYear: details.release_year ?? "",
    campaign_hours: details.campaign_hours,
    description: details.description ?? "",
  }));

  if (!isNetworkAvailable()) {
    await enqueueOfflineOperation(userId, { kind: "details", mediaId: itemId, payload: details });
    return;
  }

  await updateRemoteMediaDetails(itemId, details);
}

export async function deleteMedia(item: MediaItem) {
  const userId = await getCurrentUserId();
  await updateCachedMedia(userId, (items) => items.filter((cachedItem) => cachedItem.id !== item.id));

  if (!isNetworkAvailable()) {
    await enqueueOfflineOperation(userId, { kind: "delete", mediaId: item.id, payload: item });
    return;
  }

  await deleteRemoteMedia(item);
}

export async function saveAudiovisualCompletion(itemId: string, completion: AudiovisualCompletionDTO) {
  const userId = await getCurrentUserId();
  await mutateCachedItem(userId, itemId, (item) => applyAudiovisualCompletion(item, completion));

  if (!isNetworkAvailable()) {
    await enqueueOfflineOperation(userId, { kind: "audiovisual-completion", mediaId: itemId, payload: completion });
    return;
  }

  await saveRemoteAudiovisualCompletion(itemId, completion);
}

export async function saveBookCompletion(itemId: string, completion: BookCompletionDTO) {
  const userId = await getCurrentUserId();
  await mutateCachedItem(userId, itemId, (item) => applyBookCompletion(item, completion));

  if (!isNetworkAvailable()) {
    await enqueueOfflineOperation(userId, { kind: "book-completion", mediaId: itemId, payload: completion });
    return;
  }

  await saveRemoteBookCompletion(itemId, completion);
}

export async function saveGameCompletion(itemId: string, completion: GameCompletionDTO) {
  const userId = await getCurrentUserId();
  await mutateCachedItem(userId, itemId, (item) => applyGameCompletion(item, completion));

  if (!isNetworkAvailable()) {
    await enqueueOfflineOperation(userId, { kind: "game-completion", mediaId: itemId, payload: completion });
    return;
  }

  await saveRemoteGameCompletion(itemId, completion);
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

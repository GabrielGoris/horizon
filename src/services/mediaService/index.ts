import { supabase } from "../../lib/supabase";
import { GAME_PLATFORM_OPTIONS } from "../../consts/gamePlatforms";
import {
  enqueueOfflineOperation,
  getQueuedOperations,
  isNetworkAvailable,
  readCachedMedia,
  readCachedMediaSnapshot,
  removeQueuedOperation,
  removeCachedMedia,
  updateCachedMediaItem,
  upsertCachedMedia,
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
import type { ExistingMediaIdentity, MediaPage, MediaPageQuery } from "./types";

const MEDIA_PAGE_SIZE = 30;
const MEDIA_SELECT = "*, audiovisual_completions(*), book_completions(*), game_completions(*)";

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

const OFFLINE_SYNC_DELAY_MS = 12_000;
let offlineSyncTimer: number | null = null;

function scheduleOfflineMediaSync() {
  if (offlineSyncTimer !== null) return;

  offlineSyncTimer = window.setTimeout(() => {
    offlineSyncTimer = null;

    void syncOfflineMediaChanges().catch((error) => {
      console.warn("Não foi possível sincronizar as alterações offline em segundo plano.", error);
    });
  }, OFFLINE_SYNC_DELAY_MS);
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
    completed_year: toNullableNumber(data.completed_year),
    page_count: toNullableNumber(data.page_count),
    runtime_minutes: parseDurationMinutes(data.runtime_minutes),
    season_count: toNullableNumber(data.season_count),
    episode_count: toNullableNumber(data.episode_count),
    campaign_hours: parseDurationHours(data.campaign_hours),
    rating: toNullableNumber(data.rating),
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
    created_at: item.created_at ?? undefined,
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
    .select(MEDIA_SELECT)
    .eq("user_id", userId)
    .is("hidden_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((item) => normalizeMediaItem(item as MediaItemRow));
}

function getSortDefinition(sortMode: MediaPageQuery["sortMode"]) {
  switch (sortMode) {
    case "rating_asc":
      return { ascending: true, column: "rating" };
    case "rating_desc":
      return { ascending: false, column: "rating" };
    case "title_desc":
      return { ascending: false, column: "title" };
    case "campaign_asc":
      return { ascending: true, column: "campaign_hours" };
    case "campaign_desc":
      return { ascending: false, column: "campaign_hours" };
    case "runtime_asc":
      return { ascending: true, column: "runtime_minutes" };
    case "runtime_desc":
      return { ascending: false, column: "runtime_minutes" };
    case "pages_asc":
      return { ascending: true, column: "page_count" };
    case "pages_desc":
      return { ascending: false, column: "page_count" };
    case "title_asc":
    default:
      return { ascending: true, column: "title" };
  }
}

export async function fetchMediaPage(request: MediaPageQuery): Promise<MediaPage> {
  const userId = await getCurrentUserId();
  const pageSize = request.pageSize ?? MEDIA_PAGE_SIZE;
  const offset = request.offset ?? 0;
  const { column, ascending } = getSortDefinition(request.sortMode);
  let query = supabase
    .from("media_items")
    .select(MEDIA_SELECT, { count: "estimated" })
    .eq("user_id", userId)
    .eq("type", request.type)
    .is("hidden_at", null);

  if (request.status === "incomplete") {
    query = query.eq("status", "in_progress").eq("status_detail", "incomplete");
  } else if (request.status === "want_to_buy") {
    query = query.eq("status", "queue").eq("status_detail", "want_to_buy");
  } else if (request.status && request.status !== "all") {
    query = query.eq("status", request.status);
  }
  if (request.mediaFormat && request.mediaFormat !== "all") query = query.eq("media_format", request.mediaFormat);
  if (request.completedYear?.trim()) query = query.eq("completed_year", Number(request.completedYear));
  if (request.searchQuery?.trim()) query = query.ilike("title", `%${request.searchQuery.trim()}%`);

  if (request.gamePlatform && request.gamePlatform !== "all") {
    const platform = GAME_PLATFORM_OPTIONS.find((candidate) => candidate.label === request.gamePlatform);
    if (platform) {
      const terms = [...new Set([platform.label.toLowerCase(), ...platform.aliases])];
      query = query.or(terms.map((term) => `meta.ilike.%${term}%`).join(","));
    }
  }

  const { data, error, count } = await query
    .order(column, { ascending, nullsFirst: false })
    .order("id", { ascending: true })
    .range(offset, offset + pageSize - 1);

  if (error) throw error;

  const items = (data ?? []).map((item) => normalizeMediaItem(item as MediaItemRow));
  await Promise.all(items.map((item) => upsertCachedMedia(userId, item)));

  return {
    hasMore: offset + items.length < (count ?? 0),
    items,
    total: count ?? items.length,
  };
}

export async function fetchWishlistMedia(type: MediaItem["type"]) {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("media_items")
    .select(MEDIA_SELECT)
    .eq("user_id", userId)
    .eq("type", type)
    .is("hidden_at", null)
    .not("wishlist_position", "is", null)
    .order("wishlist_position", { ascending: true })
    .limit(10);

  if (error) throw error;

  const items = (data ?? []).map((item) => normalizeMediaItem(item as MediaItemRow));
  await Promise.all(items.map((item) => upsertCachedMedia(userId, item)));
  return items;
}

export async function fetchOverviewPriorityMedia() {
  const pages = await Promise.all([
    fetchWishlistMedia("animes"),
    fetchWishlistMedia("movies"),
    fetchWishlistMedia("games"),
    fetchWishlistMedia("books"),
  ]);

  return pages.flat();
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

  const item = data ? normalizeMediaItem(data as MediaItemRow) : null;
  if (item) await upsertCachedMedia(userId, item);
  return item;
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
      hoursPlayed: data.hours_played ?? "",
      completionType: "Campanha",
    });
  }

  return createdMedia ? fetchMediaItem({ id: createdMedia.id }) : null;
}

function getTodayDateInput() {
  return new Intl.DateTimeFormat("pt-BR").format(new Date());
}

async function saveInitialCompletion(item: MediaItem) {
  const finishedAt = getTodayDateInput();

  if (item.type === "movies" || item.type === "animes") {
    await saveRemoteAudiovisualCompletion(item.id, {
      rating: item.rating,
      watchedAt: finishedAt,
    });
    return;
  }

  if (item.type === "books") {
    await saveRemoteBookCompletion(item.id, {
      finishedAt,
      pages: String(item.page_count ?? ""),
      rating: item.rating,
    });
    return;
  }

  await saveRemoteGameCompletion(item.id, {
    completionType: item.completion_type || "Campanha",
    finishedAt,
    hoursPlayed: String(item.hours_played ?? ""),
    rating: item.rating,
  });
}

async function completeRemoteMedia(item: MediaItem) {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("media_items")
    .update({ status: "complete", status_detail: null, completed_year: new Date().getFullYear() })
    .eq("id", item.id)
    .eq("user_id", userId);

  if (error) throw error;

  await saveInitialCompletion(item);
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

async function updateRemoteMediaRating(itemId: string, rating: string) {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("media_items")
    .update({ rating: toNullableNumber(rating) })
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
  const userId = await getCurrentUserId();
  const { error: completionError } = await supabase.from("audiovisual_completions").upsert(
    {
      media_item_id: itemId,
      watched_at: toSupabaseDate(completion.watchedAt),
      rating: toNullableNumber(completion.rating),
    },
    { onConflict: "media_item_id" }
  );

  if (completionError) throw completionError;

  const { error: mediaError } = await supabase
    .from("media_items")
    .update({ rating: toNullableNumber(completion.rating) })
    .eq("id", itemId)
    .eq("user_id", userId);

  if (mediaError) throw mediaError;
}

async function saveRemoteBookCompletion(itemId: string, completion: BookCompletionDTO) {
  const userId = await getCurrentUserId();
  const { error: completionError } = await supabase.from("book_completions").upsert(
    {
      media_item_id: itemId,
      finished_at: toSupabaseDate(completion.finishedAt),
      rating: toNullableNumber(completion.rating),
      pages: toNullableNumber(completion.pages),
    },
    { onConflict: "media_item_id" }
  );

  if (completionError) throw completionError;

  const { error: mediaError } = await supabase
    .from("media_items")
    .update({ rating: toNullableNumber(completion.rating) })
    .eq("id", itemId)
    .eq("user_id", userId);

  if (mediaError) throw mediaError;
}

async function saveRemoteGameCompletion(itemId: string, completion: GameCompletionDTO) {
  const userId = await getCurrentUserId();
  const { error: completionError } = await supabase.from("game_completions").upsert(
    {
      media_item_id: itemId,
      finished_at: toSupabaseDate(completion.finishedAt),
      rating: toNullableNumber(completion.rating),
      hours_played: toNullableNumber(completion.hoursPlayed),
      completion_type: completion.completionType || null,
    },
    { onConflict: "media_item_id" }
  );

  if (completionError) throw completionError;

  const { error: mediaError } = await supabase
    .from("media_items")
    .update({ rating: toNullableNumber(completion.rating) })
    .eq("id", itemId)
    .eq("user_id", userId);

  if (mediaError) throw mediaError;
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
    created_at: new Date().toISOString(),
    added_at: new Date().toISOString(),
    completed_year: isComplete ? data.completed_year ?? new Date().getFullYear() : undefined,
    watched_at: data.type === "movies" || data.type === "animes" ? data.watched_at : undefined,
    completed_at: data.type === "books" || data.type === "games" ? completedAt : undefined,
    page_count: data.page_count,
    runtime_minutes: data.runtime_minutes,
    season_count: data.season_count,
    episode_count: data.episode_count,
    campaign_hours: data.campaign_hours,
    hours_played: data.type === "games" && isComplete ? data.hours_played : undefined,
    pages: data.type === "books" && isComplete ? data.page_count : undefined,
    completion_type: data.type === "games" && isComplete ? "Campanha" : undefined,
  };
}

async function mutateCachedItem(userId: string, itemId: string, update: (item: MediaItem) => MediaItem) {
  await updateCachedMediaItem(userId, itemId, update);
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
        if (operation.payload) {
          await completeRemoteMedia(operation.payload as MediaItem);
        } else {
          const item = await fetchMediaItem({ id: operation.mediaId });
          if (item) await completeRemoteMedia(item);
        }
        break;
      case "status":
        await updateRemoteMediaStatus(operation.mediaId, operation.payload as MediaItem["status"]);
        break;
      case "meta":
        await updateRemoteMediaMeta(operation.mediaId, operation.payload as string);
        break;
      case "rating":
        await updateRemoteMediaRating(operation.mediaId, operation.payload as string);
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

export async function fetchMedia({ forceRemote = false }: { forceRemote?: boolean } = {}) {
  const userId = await getCurrentUserId();
  const cachedSnapshot = await readCachedMediaSnapshot(userId);
  const cachedMedia = cachedSnapshot?.items ?? [];

  if (!isNetworkAvailable()) return cachedMedia;

  // A biblioteca local é a fonte da tela durante a navegação. Fazer uma leitura,
  // normalização e escrita de toda a coleção logo depois da abertura disputava a
  // thread principal com a rolagem e com o dossiê. A atualização completa fica
  // reservada para reconexão e eventos explícitos (forceRemote).
  if (!forceRemote && cachedMedia.length > 0) {
    scheduleOfflineMediaSync();
    return cachedMedia;
  }

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

export async function fetchCachedMediaSnapshot() {
  const userId = await getCurrentUserId();
  return readCachedMediaSnapshot(userId);
}

export async function createMedia(data: CreateMediaDTO) {
  const userId = await getCurrentUserId();

  if (!isNetworkAvailable()) {
    const localMedia = createLocalMedia(data, userId);
    await upsertCachedMedia(userId, localMedia);
    await enqueueOfflineOperation(userId, { kind: "create", mediaId: localMedia.id, payload: { data, id: localMedia.id } });
    return localMedia;
  }

  const createdMedia = await createRemoteMedia(data);
  if (createdMedia) {
    await upsertCachedMedia(userId, createdMedia);
  }
  return createdMedia;
}

export async function completeMedia(item: MediaItem) {
  const userId = await getCurrentUserId();
  await mutateCachedItem(userId, item.id, markMediaAsComplete);

  if (!isNetworkAvailable()) {
    await enqueueOfflineOperation(userId, { kind: "complete", mediaId: item.id, payload: item });
    return;
  }

  await completeRemoteMedia(item);
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

export async function updateMediaRating(itemId: string, rating: string) {
  const userId = await getCurrentUserId();
  await mutateCachedItem(userId, itemId, (item) => ({ ...item, rating }));

  if (!isNetworkAvailable()) {
    await enqueueOfflineOperation(userId, { kind: "rating", mediaId: itemId, payload: rating });
    return;
  }

  await updateRemoteMediaRating(itemId, rating);
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
  await removeCachedMedia(userId, item.id);

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

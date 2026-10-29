import { supabase } from "../../lib/supabase";
import { GAME_PLATFORM_OPTIONS } from "../../consts/gamePlatforms";
import {
  enqueueOfflineOperation,
  getCachedMediaItem,
  getQueuedOperations,
  isNetworkAvailable,
  readCachedMedia,
  readCachedMediaSnapshot,
  removeQueuedOperation,
  removeCachedMedia,
  updateCachedMediaItem,
  upsertCachedMedia,
  purgeStaleFailedOperations,
  updateQueuedOperation,
  upsertCachedMediaBatch,
  writeCachedMedia,
} from "../offlineStore";
import { mergeFields, normalizeFieldValue, runOfflineQueue, type ExecuteOutcome } from "../offlineStore/syncQueue";
import type { OfflineMediaOperation, QueuedOperation } from "../offlineStore/types";
import type { AudiovisualCompletionDTO } from "../../schemas/media/dto/audiovisual-completion.dto";
import type { BookCompletionDTO } from "../../schemas/media/dto/book-completion.dto";
import type { CreateMediaDTO } from "../../schemas/media/dto/create-media.dto";
import type { GameCompletionDTO } from "../../schemas/media/dto/game-completion.dto";
import type { UpdateMediaDetailsDTO } from "../../schemas/media/dto/update-media.dto";
import type { BaseMediaStatus, MediaItem, MediaItemRow, MediaStatus, MediaStatusDetail } from "../../types";
import { toSupabaseDate } from "../../utils/date";
import { notifyLibraryUpdated, notifyOfflineSyncIssues } from "../../utils/libraryEvents";
import { isSameMedia } from "./helpers";
import type { ExistingMediaIdentity, MediaPage, MediaPageCursor, MediaPageQuery } from "./types";

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

function getCompletionYearFromDate(value: string | undefined) {
  const normalizedDate = toSupabaseDate(value);

  return normalizedDate ? Number(normalizedDate.slice(0, 4)) : null;
}

function getPersistedMediaStatus(status: MediaStatus): {
  status: BaseMediaStatus;
  status_detail: MediaStatusDetail | null;
} {
  if (status === "incomplete") return { status: "in_progress", status_detail: status };
  if (status === "want_to_buy" || status === "unplanned") return { status: "queue", status_detail: status };

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

function toPostgrestValue(value: number | string) {
  if (typeof value === "number") return String(value);

  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`;
}

function getCursorFilter(
  column: ReturnType<typeof getSortDefinition>["column"],
  ascending: boolean,
  cursor: MediaPageCursor,
) {
  const id = toPostgrestValue(cursor.id);

  if (cursor.sortValue === null) {
    return `and(${column}.is.null,id.gt.${id})`;
  }

  const sortValue = toPostgrestValue(cursor.sortValue);
  const comparison = ascending ? "gt" : "lt";

  return `${column}.${comparison}.${sortValue},and(${column}.eq.${sortValue},id.gt.${id}),${column}.is.null`;
}

function getPageCursor(
  item: MediaItemRow | undefined,
  column: ReturnType<typeof getSortDefinition>["column"],
): MediaPageCursor | null {
  if (!item?.id) return null;

  const sortValue = item[column as keyof MediaItemRow];

  return {
    id: item.id,
    sortValue: typeof sortValue === "number" || typeof sortValue === "string" ? sortValue : null,
  };
}

export async function fetchMediaPage(request: MediaPageQuery): Promise<MediaPage> {
  const userId = await getCurrentUserId();
  const pageSize = request.pageSize ?? MEDIA_PAGE_SIZE;
  const { column, ascending } = getSortDefinition(request.sortMode);
  const completedYear = request.completedYear?.trim();
  const completionRelation = request.type === "games"
    ? { table: "game_completions", dateColumn: "finished_at" }
    : request.type === "books"
      ? { table: "book_completions", dateColumn: "finished_at" }
      : { table: "audiovisual_completions", dateColumn: "watched_at" };
  const hasValidYearFilter = Boolean(completedYear && /^\d{4}$/.test(completedYear));
  const select = hasValidYearFilter
    ? `${MEDIA_SELECT},matching_completion:${completionRelation.table}(),dated_completion:${completionRelation.table}()`
    : MEDIA_SELECT;
  let query = supabase
    .from("media_items")
    .select(select, { count: "exact" })
    .eq("user_id", userId)
    .eq("type", request.type)
    .is("hidden_at", null);

  if (request.status === "incomplete") {
    query = query.eq("status", "in_progress").eq("status_detail", "incomplete");
  } else if (request.status === "want_to_buy" || request.status === "unplanned") {
    query = query.eq("status", "queue").eq("status_detail", request.status);
  } else if (request.status && request.status !== "all") {
    query = query.eq("status", request.status).is("status_detail", null);
  }
  if (request.mediaFormat && request.mediaFormat !== "all") query = query.eq("media_format", request.mediaFormat);
  if (hasValidYearFilter && completedYear) {
    const startOfYear = `${completedYear}-01-01`;
    const startOfNextYear = `${Number(completedYear) + 1}-01-01`;
    // A data no registro de conclusão prevalece. completed_year é usado apenas
    // para itens antigos que ainda não têm uma data registrada nessa tabela.
    query = query
      .gte(`matching_completion.${completionRelation.dateColumn}`, startOfYear)
      .lt(`matching_completion.${completionRelation.dateColumn}`, startOfNextYear)
      .not(`dated_completion.${completionRelation.dateColumn}`, "is", null)
      .or(`matching_completion.not.is.null,and(dated_completion.is.null,completed_year.eq.${completedYear})`);
  }
  if (request.searchQuery?.trim()) query = query.ilike("title", `%${request.searchQuery.trim()}%`);

  if (request.gamePlatform && request.gamePlatform !== "all") {
    const platform = GAME_PLATFORM_OPTIONS.find((candidate) => candidate.label === request.gamePlatform);
    if (platform) {
      const terms = [...new Set([platform.label.toLowerCase(), ...platform.aliases])];
      query = query.or(terms.map((term) => `meta.ilike.%${term}%`).join(","));
    }
  }

  if (request.cursor) {
    query = query.or(getCursorFilter(column, ascending, request.cursor));
  }

  const { data, error, count } = await query
    .order(column, { ascending, nullsFirst: false })
    .order("id", { ascending: true })
    .range(0, pageSize - 1);

  if (error) throw error;

  const rows = (data ?? []) as unknown as MediaItemRow[];
  const items = rows.map((item) => normalizeMediaItem(item));
  const hasMore = count !== null ? count > rows.length : rows.length === pageSize;
  await upsertCachedMediaBatch(userId, items);

  return {
    hasMore,
    items,
    nextCursor: hasMore ? getPageCursor(rows.at(-1), column) : null,
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
  await upsertCachedMediaBatch(userId, items);
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
  const { data: insertedMedia, error } = await supabase
    .from("media_items")
    .insert([getCreateMediaPayload(data, userId, id)])
    .select("*")
    .single();

  let createdMediaId: string | undefined = insertedMedia?.id;

  if (error) {
    const alreadyExists = id && error.code === "23505" && await readRemoteRow(id, "id");

    if (!alreadyExists) throw error;

    createdMediaId = id;
  }

  const completionRating = data.rating ?? "";
  const hasCompletionDetails = data.status === "complete" || data.status === "dropped" || (data.type === "games" && data.status === "incomplete");

  if ((data.type === "movies" || data.type === "animes") && hasCompletionDetails && createdMediaId) {
    await saveAudiovisualCompletion(createdMediaId, { watchedAt: data.watched_at ?? "", rating: completionRating });
  }

  if (data.type === "books" && hasCompletionDetails && createdMediaId) {
    await saveBookCompletion(createdMediaId, {
      finishedAt: data.completed_year ?? "",
      rating: completionRating,
      pages: data.page_count,
    });
  }

  if (data.type === "games" && hasCompletionDetails && createdMediaId) {
    await saveGameCompletion(createdMediaId, {
      finishedAt: data.completed_year ?? "",
      rating: completionRating,
      hoursPlayed: data.hours_played ?? "",
      completionType: "Campanha",
    });
  }

  return createdMediaId ? fetchMediaItem({ id: createdMediaId }) : null;
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

const DETAIL_FIELDS = ["title", "creator", "director", "category", "cover", "backdrop", "release_year", "campaign_hours", "description"] as const;
type DetailField = typeof DETAIL_FIELDS[number];

async function updateRemoteMediaDetails(itemId: string, details: UpdateMediaDetailsDTO, onlyFields?: readonly string[]) {
  const userId = await getCurrentUserId();
  const payload: Record<DetailField, unknown> = {
    title: details.title.trim(),
    creator: toNullableText(details.creator),
    director: toNullableText(details.director),
    category: toNullableText(details.category),
    cover: toNullableText(details.cover),
    backdrop: toNullableText(details.backdrop),
    release_year: toNullableText(details.release_year),
    campaign_hours: parseDurationHours(details.campaign_hours),
    description: toNullableText(details.description),
  };
  const changes = onlyFields
    ? Object.fromEntries(Object.entries(payload).filter(([field]) => onlyFields.includes(field)))
    : payload;

  if (!Object.keys(changes).length) return;

  const { error } = await supabase
    .from("media_items")
    .update(changes)
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
    .update({
      completed_year: getCompletionYearFromDate(completion.watchedAt),
      rating: toNullableNumber(completion.rating),
    })
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
    .update({
      completed_year: getCompletionYearFromDate(completion.finishedAt),
      rating: toNullableNumber(completion.rating),
    })
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
    .update({
      completed_year: getCompletionYearFromDate(completion.finishedAt),
      rating: toNullableNumber(completion.rating),
    })
    .eq("id", itemId)
    .eq("user_id", userId);

  if (mediaError) throw mediaError;
}

function createLocalMedia(data: CreateMediaDTO, userId: string, id: string = crypto.randomUUID()): MediaItem {
  const isComplete = data.status === "complete";
  const hasCompletionDetails = isComplete || data.status === "dropped" || (data.type === "games" && data.status === "incomplete");
  const completedAt = hasCompletionDetails ? String(data.completed_year ?? "") : undefined;

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
    completed_year: hasCompletionDetails ? data.completed_year : undefined,
    watched_at: data.type === "movies" || data.type === "animes" ? data.watched_at : undefined,
    completed_at: data.type === "books" || data.type === "games" ? completedAt : undefined,
    page_count: data.page_count,
    runtime_minutes: data.runtime_minutes,
    season_count: data.season_count,
    episode_count: data.episode_count,
    campaign_hours: data.campaign_hours,
    hours_played: data.type === "games" && hasCompletionDetails ? data.hours_played : undefined,
    pages: data.type === "books" && hasCompletionDetails ? data.page_count : undefined,
    completion_type: data.type === "games" && hasCompletionDetails ? "Campanha" : undefined,
  };
}

async function mutateCachedItem(userId: string, itemId: string, update: (item: MediaItem) => MediaItem) {
  await updateCachedMediaItem(userId, itemId, update);
}

type RemoteRow = Record<string, unknown>;

async function readRemoteRow(itemId: string, columns: string): Promise<RemoteRow | null> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("media_items")
    .select(`${columns}, hidden_at`)
    .eq("id", itemId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  const row = data as unknown as RemoteRow | null;

  return row && !row.hidden_at ? row : null;
}

async function readRemoteCompletion(table: string, itemId: string): Promise<RemoteRow | null> {
  const { data, error } = await supabase.from(table).select("*").eq("media_item_id", itemId).maybeSingle();

  if (error) throw error;

  return (data as unknown as RemoteRow | null) ?? null;
}

function getMergedStatus(row: RemoteRow) {
  return String(row.status_detail ?? row.status ?? "");
}

function textKey(value: unknown) {
  return normalizeFieldValue(value);
}

function numberKey(value: unknown) {
  if (value === null || value === undefined || value === "") return "";

  const numberValue = Number(String(value).replace(",", "."));

  return Number.isFinite(numberValue) ? String(numberValue) : "";
}

function dateKey(value: unknown) {
  if (typeof value !== "string") return "";

  return toSupabaseDate(value) ?? value.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? "";
}

function toComparableDetails(source: Partial<Record<DetailField, unknown>>): Record<DetailField, unknown> {
  return {
    title: textKey(source.title),
    creator: textKey(source.creator),
    director: textKey(source.director),
    category: textKey(source.category),
    cover: textKey(source.cover),
    backdrop: textKey(source.backdrop),
    release_year: textKey(source.release_year),
    campaign_hours: parseDurationHours(source.campaign_hours as string | number | undefined) ?? "",
    description: textKey(source.description),
  };
}

function buildOperationBase(kind: OfflineMediaOperation["kind"], item: MediaItem | undefined): Record<string, unknown> | undefined {
  if (!item) return undefined;

  switch (kind) {
    case "complete":
    case "status":
      return { status: item.status };
    case "meta":
      return { meta: item.meta };
    case "rating":
      return { rating: numberKey(item.rating) };
    case "details":
      return toComparableDetails({
        title: item.title,
        creator: item.creator,
        director: item.director,
        category: item.category,
        cover: item.cover,
        backdrop: item.backdrop,
        release_year: item.releaseYear,
        campaign_hours: item.campaign_hours,
        description: item.description,
      });
    case "audiovisual-completion":
      return { date: dateKey(item.watched_at), rating: numberKey(item.rating) };
    case "book-completion":
      return { date: dateKey(item.completed_at), rating: numberKey(item.rating), pages: numberKey(item.pages) };
    case "game-completion":
      return {
        date: dateKey(item.completed_at),
        rating: numberKey(item.rating),
        hours: numberKey(item.hours_played),
        completionType: textKey(item.completion_type),
      };
    default:
      return undefined;
  }
}

async function captureOperationBase(userId: string, itemId: string, kind: OfflineMediaOperation["kind"]) {
  if (isNetworkAvailable()) return undefined;

  return buildOperationBase(kind, await getCachedMediaItem(userId, itemId));
}

async function applyMergedScalar(
  base: Record<string, unknown> | undefined,
  field: string,
  serverValue: unknown,
  intendedValue: unknown,
  write: () => Promise<void>,
): Promise<ExecuteOutcome> {
  if (!base || !(field in base)) {
    await write();
    return "applied";
  }

  const { apply, conflicts } = mergeFields({ [field]: base[field] }, { [field]: serverValue }, { [field]: intendedValue });

  if (conflicts.length) return "conflict";
  if (!apply.length) return "already-applied";

  await write();
  return "applied";
}

async function applyCompletionOperation(
  operation: QueuedOperation,
  table: string,
  readServer: (completion: RemoteRow | null, media: RemoteRow) => Record<string, unknown>,
  intended: Record<string, unknown>,
  write: () => Promise<void>,
): Promise<ExecuteOutcome> {
  const media = await readRemoteRow(operation.mediaId, "id, rating");

  if (!media) return "gone";

  if (!operation.base) {
    await write();
    return "applied";
  }

  const { apply, conflicts } = mergeFields(operation.base, readServer(await readRemoteCompletion(table, operation.mediaId), media), intended);

  if (conflicts.length) return "conflict";
  if (!apply.length) return "already-applied";

  await write();
  return "applied";
}

async function executeQueuedOperation(operation: QueuedOperation): Promise<ExecuteOutcome> {
  const { mediaId, base } = operation;

  switch (operation.kind) {
    case "create": {
      const payload = operation.payload as { data: CreateMediaDTO; id: string };
      await createRemoteMedia(payload.data, payload.id);
      return "applied";
    }
    case "complete": {
      const row = await readRemoteRow(mediaId, "status, status_detail");

      if (!row) return "gone";

      const serverStatus = getMergedStatus(row);

      if (serverStatus === "complete") return "already-applied";
      if (base && "status" in base && textKey(base.status) !== textKey(serverStatus)) return "conflict";

      const item = (operation.payload as MediaItem | undefined) ?? await fetchMediaItem({ id: mediaId });

      if (!item) return "gone";

      await completeRemoteMedia(item);
      return "applied";
    }
    case "status": {
      const row = await readRemoteRow(mediaId, "status, status_detail");

      if (!row) return "gone";

      const status = operation.payload as MediaItem["status"];

      return applyMergedScalar(base, "status", getMergedStatus(row), status, () => updateRemoteMediaStatus(mediaId, status));
    }
    case "meta": {
      const row = await readRemoteRow(mediaId, "meta");

      if (!row) return "gone";

      const meta = operation.payload as string;

      return applyMergedScalar(base, "meta", row.meta, meta, () => updateRemoteMediaMeta(mediaId, meta));
    }
    case "rating": {
      const row = await readRemoteRow(mediaId, "rating");

      if (!row) return "gone";

      const rating = operation.payload as string;

      return applyMergedScalar(base, "rating", numberKey(row.rating), numberKey(rating), () => updateRemoteMediaRating(mediaId, rating));
    }
    case "details": {
      const row = await readRemoteRow(mediaId, DETAIL_FIELDS.join(", "));

      if (!row) return "gone";

      const details = operation.payload as UpdateMediaDetailsDTO;

      if (!base) {
        await updateRemoteMediaDetails(mediaId, details);
        return "applied";
      }

      const { apply, conflicts } = mergeFields(toComparableDetails(base), toComparableDetails(row), toComparableDetails(details));

      if (apply.length) await updateRemoteMediaDetails(mediaId, details, apply);
      if (conflicts.length) return "conflict";

      return apply.length ? "applied" : "already-applied";
    }
    case "delete":
      await deleteRemoteMedia(operation.payload as MediaItem);
      return "applied";
    case "audiovisual-completion": {
      const completion = operation.payload as AudiovisualCompletionDTO;

      return applyCompletionOperation(
        operation,
        "audiovisual_completions",
        (row, media) => ({ date: dateKey(row?.watched_at), rating: numberKey(row?.rating ?? media.rating) }),
        { date: dateKey(completion.watchedAt), rating: numberKey(completion.rating) },
        () => saveRemoteAudiovisualCompletion(mediaId, completion),
      );
    }
    case "book-completion": {
      const completion = operation.payload as BookCompletionDTO;

      return applyCompletionOperation(
        operation,
        "book_completions",
        (row, media) => ({ date: dateKey(row?.finished_at), rating: numberKey(row?.rating ?? media.rating), pages: numberKey(row?.pages) }),
        { date: dateKey(completion.finishedAt), rating: numberKey(completion.rating), pages: numberKey(completion.pages) },
        () => saveRemoteBookCompletion(mediaId, completion),
      );
    }
    case "game-completion": {
      const completion = operation.payload as GameCompletionDTO;

      return applyCompletionOperation(
        operation,
        "game_completions",
        (row, media) => ({
          date: dateKey(row?.finished_at),
          rating: numberKey(row?.rating ?? media.rating),
          hours: numberKey(row?.hours_played),
          completionType: textKey(row?.completion_type),
        }),
        {
          date: dateKey(completion.finishedAt),
          rating: numberKey(completion.rating),
          hours: numberKey(completion.hoursPlayed),
          completionType: textKey(completion.completionType),
        },
        () => saveRemoteGameCompletion(mediaId, completion),
      );
    }
  }
}

async function runOfflineSync() {
  const userId = await getCurrentUserId();
  const operations = await getQueuedOperations(userId);

  if (!operations.some((operation) => !operation.failedAt)) return false;

  const summary = await runOfflineQueue(operations, {
    execute: executeQueuedOperation,
    onSettled: async (operation) => {
      if (operation.id !== undefined) await removeQueuedOperation(operation.id);
    },
    onRetry: async (operation, patch) => {
      if (operation.id !== undefined) await updateQueuedOperation(operation.id, patch);
    },
    onFailed: async (operation, patch) => {
      console.warn(`Operação offline "${operation.kind}" descartada:`, patch.lastError);
      if (operation.id !== undefined) await updateQueuedOperation(operation.id, patch);
    },
  });

  await purgeStaleFailedOperations(userId);

  if (summary.conflicts || summary.gone || summary.failed) {
    notifyOfflineSyncIssues({ conflicts: summary.conflicts, failed: summary.failed, gone: summary.gone });
  }

  if (summary.conflicts || summary.gone) notifyLibraryUpdated();

  return summary.applied + summary.conflicts + summary.gone > 0;
}

const SYNC_LOCK_NAME = "horizon-offline-sync";
let offlineSyncInFlight: Promise<boolean> | null = null;

async function withCrossTabSyncLock(task: () => Promise<boolean>) {
  if (typeof navigator === "undefined" || !navigator.locks) return task();

  // ifAvailable: se outra aba já está sincronizando, esta não repete as mesmas operações.
  const result = await navigator.locks.request(SYNC_LOCK_NAME, { ifAvailable: true }, (lock) => lock ? task() : Promise.resolve(false));

  return Boolean(result);
}

export function syncOfflineMediaChanges() {
  if (!isNetworkAvailable()) return Promise.resolve(false);
  if (offlineSyncInFlight) return offlineSyncInFlight;

  offlineSyncInFlight = withCrossTabSyncLock(runOfflineSync).finally(() => {
    offlineSyncInFlight = null;
  });

  return offlineSyncInFlight;
}

export async function fetchMedia({ forceRemote = false }: { forceRemote?: boolean } = {}) {
  const userId = await getCurrentUserId();
  const cachedSnapshot = await readCachedMediaSnapshot(userId);
  const cachedMedia = cachedSnapshot?.items ?? [];

  if (!isNetworkAvailable()) return cachedMedia;

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
  const base = await captureOperationBase(userId, item.id, "complete");
  await mutateCachedItem(userId, item.id, markMediaAsComplete);

  if (!isNetworkAvailable()) {
    await enqueueOfflineOperation(userId, { kind: "complete", mediaId: item.id, payload: item, base });
    return;
  }

  await completeRemoteMedia(item);
}

export async function updateMediaStatus(itemId: string, status: MediaItem["status"]) {
  const userId = await getCurrentUserId();
  const base = await captureOperationBase(userId, itemId, "status");
  await mutateCachedItem(userId, itemId, (item) => status === "complete" ? markMediaAsComplete(item) : { ...item, status, completed_year: undefined });

  if (!isNetworkAvailable()) {
    await enqueueOfflineOperation(userId, { kind: "status", mediaId: itemId, payload: status, base });
    return;
  }

  await updateRemoteMediaStatus(itemId, status);
}

export async function updateMediaMeta(itemId: string, meta: string) {
  const userId = await getCurrentUserId();
  const base = await captureOperationBase(userId, itemId, "meta");
  await mutateCachedItem(userId, itemId, (item) => ({ ...item, meta }));

  if (!isNetworkAvailable()) {
    await enqueueOfflineOperation(userId, { kind: "meta", mediaId: itemId, payload: meta, base });
    return;
  }

  await updateRemoteMediaMeta(itemId, meta);
}

export async function updateMediaRating(itemId: string, rating: string) {
  const userId = await getCurrentUserId();
  const base = await captureOperationBase(userId, itemId, "rating");
  await mutateCachedItem(userId, itemId, (item) => ({ ...item, rating }));

  if (!isNetworkAvailable()) {
    await enqueueOfflineOperation(userId, { kind: "rating", mediaId: itemId, payload: rating, base });
    return;
  }

  await updateRemoteMediaRating(itemId, rating);
}

export async function updateMediaDetails(itemId: string, details: UpdateMediaDetailsDTO) {
  const userId = await getCurrentUserId();
  const base = await captureOperationBase(userId, itemId, "details");
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
    await enqueueOfflineOperation(userId, { kind: "details", mediaId: itemId, payload: details, base });
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
  const base = await captureOperationBase(userId, itemId, "audiovisual-completion");
  await mutateCachedItem(userId, itemId, (item) => applyAudiovisualCompletion(item, completion));

  if (!isNetworkAvailable()) {
    await enqueueOfflineOperation(userId, { kind: "audiovisual-completion", mediaId: itemId, payload: completion, base });
    return;
  }

  await saveRemoteAudiovisualCompletion(itemId, completion);
}

export async function saveBookCompletion(itemId: string, completion: BookCompletionDTO) {
  const userId = await getCurrentUserId();
  const base = await captureOperationBase(userId, itemId, "book-completion");
  await mutateCachedItem(userId, itemId, (item) => applyBookCompletion(item, completion));

  if (!isNetworkAvailable()) {
    await enqueueOfflineOperation(userId, { kind: "book-completion", mediaId: itemId, payload: completion, base });
    return;
  }

  await saveRemoteBookCompletion(itemId, completion);
}

export async function saveGameCompletion(itemId: string, completion: GameCompletionDTO) {
  const userId = await getCurrentUserId();
  const base = await captureOperationBase(userId, itemId, "game-completion");
  await mutateCachedItem(userId, itemId, (item) => applyGameCompletion(item, completion));

  if (!isNetworkAvailable()) {
    await enqueueOfflineOperation(userId, { kind: "game-completion", mediaId: itemId, payload: completion, base });
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
    completed_year: getCompletionYearFromDate(completion.watchedAt) ?? item.completed_year,
    rating: completion.rating,
    watched_at: completion.watchedAt,
  };
}

export function applyBookCompletion(item: MediaItem, completion: BookCompletionDTO): MediaItem {
  return {
    ...item,
    completed_year: getCompletionYearFromDate(completion.finishedAt) ?? item.completed_year,
    rating: completion.rating,
    completed_at: completion.finishedAt,
    pages: completion.pages,
  };
}

export function applyGameCompletion(item: MediaItem, completion: GameCompletionDTO): MediaItem {
  return {
    ...item,
    completed_year: getCompletionYearFromDate(completion.finishedAt) ?? item.completed_year,
    rating: completion.rating,
    completed_at: completion.finishedAt,
    hours_played: completion.hoursPlayed,
    completion_type: completion.completionType,
  };
}

import { supabase } from "../lib/supabase";
import type { BookCompletionDTO } from "../schemas/media/dto/book-completion.dto";
import type { CreateMediaDTO } from "../schemas/media/dto/create-media.dto";
import type { GameCompletionDTO } from "../schemas/media/dto/game-completion.dto";
import type { MovieTicketDTO } from "../schemas/media/dto/movie-ticket.dto";
import type { MediaItem, MediaItemRow } from "../types";



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

  return Number(value);
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
    type: item.type,
    status: item.status,
    releaseYear: item.release_year ?? "",
    meta: item.meta ?? "",
    rating: formatRating(completion?.rating ?? item.rating),
    description: item.description ?? "",
    watched_at: movieCompletion?.watched_at ?? undefined,
    completed_at: bookCompletion?.finished_at ?? gameCompletion?.finished_at ?? undefined,
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
  const { error } = await supabase.from("media_items").insert([data]);

  if (error) throw error;
}

export async function completeMedia(itemId: string) {
  const { error } = await supabase
    .from("media_items")
    .update({ status: "complete" })
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
      watched_at: ticket.watchedAt,
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

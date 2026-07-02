import { supabase } from "../lib/supabase";
import type { BookCompletionDTO } from "../schemas/media/dto/book-completion.dto";
import type { CreateMediaDTO } from "../schemas/media/dto/create-media.dto";
import type { GameCompletionDTO } from "../schemas/media/dto/game-completion.dto";
import type { MovieTicketDTO } from "../schemas/media/dto/movie-ticket.dto";
import type { MediaItem } from "../types";

export async function fetchMedia() {
  const { data, error } = await supabase
    .from("media_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data ?? [];
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
  const { error } = await supabase
    .from("media_items")
    .update({ rating: ticket.rating, watched_at: ticket.watchedAt })
    .eq("id", itemId);

  if (error) throw error;
}

export async function saveBookCompletion(itemId: string, completion: BookCompletionDTO) {
  const { error } = await supabase
    .from("media_items")
    .update({
      completed_at: completion.finishedAt,
      rating: completion.rating,
      pages: completion.pages ? Number(completion.pages) : null,
    })
    .eq("id", itemId);

  if (error) throw error;
}

export async function saveGameCompletion(itemId: string, completion: GameCompletionDTO) {
  const { error } = await supabase
    .from("media_items")
    .update({
      completed_at: completion.finishedAt,
      rating: completion.rating,
      hours_played: completion.hoursPlayed ? Number(completion.hoursPlayed) : null,
      completion_type: completion.completionType || null,
    })
    .eq("id", itemId);

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

import { supabase } from "../lib/supabase";
import type { CreateMediaDTO } from "../schemas/media/dto/create-media.dto";
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

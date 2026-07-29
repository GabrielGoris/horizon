import { supabase } from "../../lib/supabase";
import { toSupabaseDate } from "../../utils/date";

export type AudiovisualSeasonCompletion = {
  rating: number | null;
  seasonNumber: number;
  watchedAt: string;
};

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) throw new Error("Usuário não autenticado.");
  return data.session.user.id;
}

export async function fetchAudiovisualSeasonCompletions(mediaItemId: string) {
  const { data, error } = await supabase
    .from("audiovisual_season_completions")
    .select("season_number, watched_at, rating")
    .eq("media_item_id", mediaItemId)
    .order("season_number", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    rating: typeof row.rating === "number" ? row.rating : null,
    seasonNumber: row.season_number,
    watchedAt: row.watched_at,
  }));
}

export async function saveAudiovisualSeasonCompletion(
  mediaItemId: string,
  seasonNumber: number,
  watchedAt: string,
  rating: number | null,
) {
  const userId = await getCurrentUserId();
  const normalizedDate = toSupabaseDate(watchedAt);
  if (!normalizedDate) throw new Error("Informe uma data válida.");

  const { error } = await supabase
    .from("audiovisual_season_completions")
    .upsert({ media_item_id: mediaItemId, rating, season_number: seasonNumber, user_id: userId, watched_at: normalizedDate }, { onConflict: "media_item_id,season_number" });
  if (error) throw error;
}

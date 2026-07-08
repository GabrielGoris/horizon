import { z } from "zod";

export const createMediaSchema = z.object({
  title: z.string().min(1, "O titulo e obrigatorio."),
  creator: z.string().optional(),
  director: z.string().optional(),
  type: z.enum(["games", "movies", "books"] as const),
  movie_kind: z.enum(["movie", "series"] as const).optional(),
  category: z.string().optional(),
  cover: z.string().url("Insira uma URL valida (http://...)").or(z.literal("")).optional(),
  backdrop: z.string().url("Insira uma URL valida (http://...)").or(z.literal("")).optional(),
  status: z.enum(["queue", "in_progress", "dropped", "complete"] as const),
  release_year: z.string().optional(),
  added_at: z.string().optional(),
  completed_year: z.string().optional(),
  watched_at: z.string().optional(),
  page_count: z.string().optional(),
  runtime_minutes: z.string().optional(),
  season_count: z.string().optional(),
  episode_count: z.string().optional(),
  campaign_hours: z.string().optional(),
  rating: z.string().optional(),
  meta: z.string().optional(),
  description: z.string().optional(),
});

export type CreateMediaDTO = z.infer<typeof createMediaSchema>;

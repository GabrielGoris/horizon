import { z } from "zod";

export const createMediaSchema = z.object({
  title: z.string().min(1, "O titulo e obrigatorio."),
  creator: z.string().optional(),
  director: z.string().optional(),
  type: z.enum(["games", "movies", "books"] as const),
  category: z.string().optional(),
  cover: z.string().url("Insira uma URL valida (http://...)").or(z.literal("")).optional(),
  backdrop: z.string().url("Insira uma URL valida (http://...)").or(z.literal("")).optional(),
  status: z.enum(["queue", "reading", "new", "complete"] as const),
  release_year: z.string().optional(),
  meta: z.string().optional(),
  description: z.string().optional(),
});

export type CreateMediaDTO = z.infer<typeof createMediaSchema>;

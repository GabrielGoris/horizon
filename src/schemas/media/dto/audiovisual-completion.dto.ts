import { z } from "zod";

export const audiovisualCompletionSchema = z.object({
  watchedAt: z.string().min(1, "Informe a data assistida."),
  rating: z.string(),
});

export type AudiovisualCompletionDTO = z.infer<typeof audiovisualCompletionSchema>;

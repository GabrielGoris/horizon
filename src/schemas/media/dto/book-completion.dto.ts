import { z } from "zod";

export const bookCompletionSchema = z.object({
  finishedAt: z.string().min(1, "Informe a data de conclusao."),
  rating: z.string(),
  pages: z.string().optional(),
});

export type BookCompletionDTO = z.infer<typeof bookCompletionSchema>;

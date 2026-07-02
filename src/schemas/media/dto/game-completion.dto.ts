import { z } from "zod";

export const gameCompletionSchema = z.object({
  finishedAt: z.string().min(1, "Informe a data de conclusao."),
  rating: z.string(),
  hoursPlayed: z.string().optional(),
  completionType: z.string().optional(),
});

export type GameCompletionDTO = z.infer<typeof gameCompletionSchema>;

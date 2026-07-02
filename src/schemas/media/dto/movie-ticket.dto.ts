import { z } from "zod";

export const movieTicketSchema = z.object({
  watchedAt: z.string().min(1, "Informe a data assistida."),
  rating: z.string(),
});

export type MovieTicketDTO = z.infer<typeof movieTicketSchema>;

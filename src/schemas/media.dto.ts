import { z } from "zod";

export const mediaSchemaValidator = z.object({
  title: z.string().min(1, "O título é obrigatório."),
  creator: z.string().optional(),
  type: z.enum(["games", "movies", "books"] as const),
  category: z.string().optional(),
  cover: z.string().url("Insira uma URL válida (http://...)").or(z.literal("")).optional(),
  status: z.enum(["queue", "reading", "new", "complete"] as const),
  description: z.string().optional(),
});

export type MediaDTO = z.infer<typeof mediaSchemaValidator>;

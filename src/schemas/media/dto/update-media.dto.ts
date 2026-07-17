import { z } from "zod";
import { createMediaSchema } from "./create-media.dto";
import type { CreateMediaDTO } from "./create-media.dto";

export const updateMediaSchema = createMediaSchema.partial();

export const updateMediaDetailsSchema = createMediaSchema.pick({
  backdrop: true,
  campaign_hours: true,
  category: true,
  cover: true,
  creator: true,
  description: true,
  director: true,
  release_year: true,
  title: true,
});

export type UpdateMediaDTO = Partial<CreateMediaDTO>;
export type UpdateMediaDetailsDTO = z.infer<typeof updateMediaDetailsSchema>;

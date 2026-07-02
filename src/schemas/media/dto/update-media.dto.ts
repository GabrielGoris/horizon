import { createMediaSchema } from "./create-media.dto";
import type { CreateMediaDTO } from "./create-media.dto";

export const updateMediaSchema = createMediaSchema.partial();

export type UpdateMediaDTO = Partial<CreateMediaDTO>;

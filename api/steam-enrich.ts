import type { ServerResponse } from "node:http";
import type { ApiRequest } from "../server/http";
import steamEnrichHandler from "../server/steamRoutes/steam-enrich";

export const maxDuration = 60;

export default async function handler(req: ApiRequest, res: ServerResponse) {
  await steamEnrichHandler(req, res);
}

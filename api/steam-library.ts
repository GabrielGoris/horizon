import type { ServerResponse } from "node:http";
import type { ApiRequest } from "../server/http";
import steamLibraryHandler from "../server/steamRoutes/steam-library";

export const maxDuration = 60;

export default async function handler(req: ApiRequest, res: ServerResponse) {
  await steamLibraryHandler(req, res);
}

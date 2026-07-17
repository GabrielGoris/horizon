import type { ServerResponse } from "node:http";
import type { ApiRequest } from "../server/http.js";
import steamCallbackHandler from "../server/steamRoutes/steam-callback.js";

export default async function handler(req: ApiRequest, res: ServerResponse) {
  await steamCallbackHandler(req, res);
}

import type { ServerResponse } from "node:http";
import type { ApiRequest } from "../server/http";
import steamCallbackHandler from "../server/steamRoutes/steam-callback";

export default async function handler(req: ApiRequest, res: ServerResponse) {
  await steamCallbackHandler(req, res);
}

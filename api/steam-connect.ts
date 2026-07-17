import type { ServerResponse } from "node:http";
import type { ApiRequest } from "../server/http.js";
import steamConnectHandler from "../server/steamRoutes/steam-connect.js";

export default async function handler(req: ApiRequest, res: ServerResponse) {
  await steamConnectHandler(req, res);
}

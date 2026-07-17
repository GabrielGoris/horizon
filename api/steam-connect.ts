import type { ServerResponse } from "node:http";
import type { ApiRequest } from "../server/http";
import steamConnectHandler from "../server/steamRoutes/steam-connect";

export default async function handler(req: ApiRequest, res: ServerResponse) {
  await steamConnectHandler(req, res);
}

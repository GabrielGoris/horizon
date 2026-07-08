import type { ApiRequest, ApiResponse } from "../_utils";
import { getProxyEndpoint, pipeFetchResponse, sendMethodNotAllowed, sendResponse } from "../_utils";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    if (req.method !== "GET") {
      sendMethodNotAllowed(res);
      return;
    }

    const endpoint = getProxyEndpoint(req, "/api/steam-api");
    const response = await fetch(`https://store.steampowered.com/${endpoint}`);

    await pipeFetchResponse(res, response);
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, error instanceof Error ? error.message : "Erro ao consultar Steam.");
  }
}

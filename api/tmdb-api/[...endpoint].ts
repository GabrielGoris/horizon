import type { ApiRequest, ApiResponse } from "../_utils";
import { getProxyEndpoint, pipeFetchResponse, sendMethodNotAllowed, sendResponse } from "../_utils";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    if (req.method !== "GET") {
      sendMethodNotAllowed(res);
      return;
    }

    const tmdbAccessToken = process.env.TMDB_ACCESS_TOKEN ?? process.env.VITE_TMDB_ACCESS_TOKEN;
    const tmdbApiKey = process.env.TMDB_API_KEY ?? process.env.VITE_TMDB_API_KEY;

    if (!tmdbAccessToken && !tmdbApiKey) {
      sendResponse(res, 500, "Configure TMDB_ACCESS_TOKEN ou TMDB_API_KEY no Vercel.");
      return;
    }

    const endpoint = getProxyEndpoint(req, "/api/tmdb-api");
    const url = new URL(endpoint, "https://api.themoviedb.org/3/");

    if (!tmdbAccessToken && tmdbApiKey) {
      url.searchParams.set("api_key", tmdbApiKey);
    }

    const response = await fetch(url, {
      headers: tmdbAccessToken
        ? {
            Authorization: `Bearer ${tmdbAccessToken}`,
            Accept: "application/json",
          }
        : {
            Accept: "application/json",
          },
    });

    await pipeFetchResponse(res, response);
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, error instanceof Error ? error.message : "Erro ao consultar TMDB.");
  }
}

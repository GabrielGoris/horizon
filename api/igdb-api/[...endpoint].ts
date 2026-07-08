import type { ApiRequest, ApiResponse } from "../_utils";
import { getProxyEndpoint, pipeFetchResponse, readRequestBody, sendMethodNotAllowed, sendResponse } from "../_utils";

type TwitchTokenResponse = {
  access_token: string;
  expires_in: number;
};

let igdbAccessToken = "";
let igdbTokenExpiresAt = 0;

async function getAccessToken(clientId: string, clientSecret: string) {
  if (igdbAccessToken && Date.now() < igdbTokenExpiresAt) {
    return igdbAccessToken;
  }

  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel autenticar na IGDB.");
  }

  const data = (await response.json()) as TwitchTokenResponse;

  igdbAccessToken = data.access_token;
  igdbTokenExpiresAt = Date.now() + Math.max(0, data.expires_in - 60) * 1000;

  return igdbAccessToken;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    if (req.method !== "POST") {
      sendMethodNotAllowed(res);
      return;
    }

    const clientId = process.env.IGDB_CLIENT_ID ?? process.env.VITE_IGDB_CLIENT_ID;
    const clientSecret = process.env.IGDB_CLIENT_SECRET ?? process.env.VITE_IGDB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      sendResponse(res, 500, "Configure IGDB_CLIENT_ID e IGDB_CLIENT_SECRET no Vercel.");
      return;
    }

    const endpoint = getProxyEndpoint(req, "/api/igdb-api");
    const token = await getAccessToken(clientId, clientSecret);
    const body = await readRequestBody(req);
    const response = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Client-ID": clientId,
        "Content-Type": "text/plain",
      },
      body,
    });

    await pipeFetchResponse(res, response);
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, error instanceof Error ? error.message : "Erro ao consultar IGDB.");
  }
}

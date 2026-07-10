import type { IncomingMessage, ServerResponse } from "node:http";

if (!process.env.VERCEL) {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // Vercel CLI may already have loaded the local environment.
  }
}

type ApiRequest = IncomingMessage & {
  body?: unknown;
};
type ApiResponse = ServerResponse;

type CatalogProxyService = "books" | "igdb" | "steam" | "tmdb";

type TwitchTokenResponse = {
  access_token: string;
  expires_in: number;
};

let igdbAccessToken = "";
let igdbTokenExpiresAt = 0;

function getEnvValue(...names: string[]) {
  return names.map((name) => process.env[name]).find(Boolean) ?? "";
}

function sendJson(res: ApiResponse, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function readRequestBody(req: ApiRequest) {
  if (typeof req.body === "string") return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");
  if (req.body !== undefined && req.body !== null) return String(req.body);

  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function pipeFetchResponse(res: ApiResponse, response: Response) {
  const ignoredHeaders = new Set(["content-encoding", "content-length", "transfer-encoding"]);

  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    if (!ignoredHeaders.has(key.toLowerCase())) {
      res.setHeader(key, value);
    }
  });

  res.end(Buffer.from(await response.arrayBuffer()));
}

function isCatalogProxyService(value: string | null): value is CatalogProxyService {
  return value === "books" || value === "igdb" || value === "steam" || value === "tmdb";
}

function getRequestParams(req: ApiRequest) {
  const url = new URL(req.url ?? "", "https://horizon.local");
  const service = url.searchParams.get("service");
  const endpoint = url.searchParams.get("endpoint") ?? "";

  return { service, endpoint };
}

function assertSafeEndpoint(endpoint: string) {
  if (!endpoint || endpoint.startsWith("/") || endpoint.startsWith("//") || endpoint.includes("://") || endpoint.includes("..")) {
    throw new Error("Endpoint invalido para proxy.");
  }
}

function logProxyRequest(service: CatalogProxyService, endpoint: string, method: string | undefined, status: number) {
  console.info("[catalog-proxy]", JSON.stringify({ service, endpoint, method, status }));
}

async function getIgdbAccessToken(clientId: string, clientSecret: string) {
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

async function fetchIgdb(req: ApiRequest, endpoint: string) {
  if (req.method !== "POST") {
    return { response: null, error: `Metodo ${req.method} nao permitido para IGDB. Use POST.`, statusCode: 405 };
  }

  const clientId = getEnvValue("IGDB_CLIENT_ID", "VITE_IGDB_CLIENT_ID");
  const clientSecret = getEnvValue("IGDB_CLIENT_SECRET", "VITE_IGDB_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    return { response: null, error: "Configure IGDB_CLIENT_ID e IGDB_CLIENT_SECRET no Vercel.", statusCode: 500 };
  }

  const token = await getIgdbAccessToken(clientId, clientSecret);
  const body = await readRequestBody(req);

  if (!body.trim()) {
    return { response: null, error: "Query vazia para IGDB.", statusCode: 400 };
  }

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

  return { response, error: "", statusCode: response.status };
}

async function fetchSteam(req: ApiRequest, endpoint: string) {
  if (req.method !== "GET") {
    return { response: null, error: `Metodo ${req.method} nao permitido para Steam. Use GET.`, statusCode: 405 };
  }

  const response = await fetch(`https://store.steampowered.com/${endpoint}`);

  return { response, error: "", statusCode: response.status };
}

async function fetchTmdb(req: ApiRequest, endpoint: string) {
  if (req.method !== "GET") {
    return { response: null, error: `Metodo ${req.method} nao permitido para TMDB. Use GET.`, statusCode: 405 };
  }

  const tmdbAccessToken = getEnvValue("TMDB_ACCESS_TOKEN", "VITE_TMDB_ACCESS_TOKEN");
  const tmdbApiKey = getEnvValue("TMDB_API_KEY", "VITE_TMDB_API_KEY");

  if (!tmdbAccessToken && !tmdbApiKey) {
    return { response: null, error: "Configure TMDB_ACCESS_TOKEN ou TMDB_API_KEY no Vercel.", statusCode: 500 };
  }

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

  return { response, error: "", statusCode: response.status };
}

async function fetchBooks(req: ApiRequest, endpoint: string) {
  if (req.method !== "GET") {
    return { response: null, error: `Metodo ${req.method} nao permitido para Open Library. Use GET.`, statusCode: 405 };
  }

  const response = await fetch(`https://openlibrary.org/${endpoint}`);

  return { response, error: "", statusCode: response.status };
}

async function fetchCatalogService(service: CatalogProxyService, req: ApiRequest, endpoint: string) {
  if (service === "igdb") return fetchIgdb(req, endpoint);
  if (service === "steam") return fetchSteam(req, endpoint);
  if (service === "tmdb") return fetchTmdb(req, endpoint);

  return fetchBooks(req, endpoint);
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }

    const { service, endpoint } = getRequestParams(req);

    if (!service && !endpoint) {
      sendJson(res, 200, { ok: true, name: "catalog-proxy" });
      return;
    }

    if (!isCatalogProxyService(service)) {
      sendJson(res, 400, {
        ok: false,
        message: "Service invalido. Use books, igdb, steam ou tmdb.",
      });
      return;
    }

    assertSafeEndpoint(endpoint);

    const { response, error, statusCode } = await fetchCatalogService(service, req, endpoint);

    if (!response) {
      logProxyRequest(service, endpoint, req.method, statusCode);
      sendJson(res, statusCode, { ok: false, service, endpoint, method: req.method, message: error });
      return;
    }

    logProxyRequest(service, endpoint, req.method, statusCode);
    await pipeFetchResponse(res, response);
  } catch (error) {
    console.error("[catalog-proxy]", error);
    sendJson(res, 500, {
      ok: false,
      message: error instanceof Error ? error.message : "Erro ao consultar catalogo.",
    });
  }
}

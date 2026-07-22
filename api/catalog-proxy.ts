import type { IncomingMessage, ServerResponse } from "node:http";
import { HowLongToBeatService, SearchModifier } from "howlongtobeat-ts";

if (!process.env.VERCEL) {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // The Vercel CLI may already have loaded the local environment.
  }
}

type ApiRequest = IncomingMessage & {
  body?: unknown;
};
type ApiResponse = ServerResponse;
type CatalogProxyService = "books" | "brasil-api" | "google-books" | "hltb" | "igdb" | "steam" | "tmdb";

type TwitchTokenResponse = {
  access_token: string;
  expires_in: number;
};

type ProxyFetchResult = {
  response: Response | null;
  error: string;
  statusCode: number;
};

const upstreamTimeoutMs = 8_000;
const maxRequestBodyBytes = 32_000;
const rateLimitWindowMs = 60_000;
const rateLimitMaxRequests = 60;
const hltbService = new HowLongToBeatService({
  minSimilarity: 0.45,
  retries: 0,
  timeout: upstreamTimeoutMs,
});

let igdbAccessToken = "";
let igdbTokenExpiresAt = 0;
let igdbTokenPromise: Promise<string> | null = null;
let nextBooksRequestAt = 0;
let booksSchedule: Promise<void> = Promise.resolve();

const proxyRateLimits = new Map<string, { count: number; resetAt: number }>();

function getEnvValue(...names: string[]) {
  return names.map((name) => process.env[name]).find(Boolean) ?? "";
}

function sendJson(res: ApiResponse, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function setCorsHeaders(res: ApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function readRequestBody(req: ApiRequest) {
  if (typeof req.body === "string") return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");
  if (req.body !== undefined && req.body !== null) return String(req.body);

  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;

    if (size > maxRequestBodyBytes) {
      throw new Error("Query do catálogo excede o limite permitido.");
    }

    chunks.push(buffer);
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function pipeFetchResponse(res: ApiResponse, response: Response, cacheable: boolean) {
  res.statusCode = response.status;

  const contentType = response.headers.get("content-type");
  const retryAfter = response.headers.get("retry-after");

  if (contentType) res.setHeader("Content-Type", contentType);
  if (retryAfter) res.setHeader("Retry-After", retryAfter);

  res.setHeader(
    "Cache-Control",
    response.ok && cacheable
      ? "public, s-maxage=300, stale-while-revalidate=3600"
      : "no-store"
  );
  res.end(Buffer.from(await response.arrayBuffer()));
}

function isCatalogProxyService(value: string | null): value is CatalogProxyService {
  return value === "books" || value === "brasil-api" || value === "google-books" || value === "hltb" || value === "igdb" || value === "steam" || value === "tmdb";
}

function getRequestParams(req: ApiRequest) {
  const url = new URL(req.url ?? "", "https://horizon.local");
  const service = url.searchParams.get("service");
  const endpoint = url.searchParams.get("endpoint") ?? "";

  return { service, endpoint };
}

function getEndpointPath(endpoint: string) {
  return endpoint.split(/[?#]/)[0] ?? "";
}

function isAllowedEndpoint(service: CatalogProxyService, endpoint: string) {
  const path = getEndpointPath(endpoint);

  if (service === "igdb") {
    return ["games", "search", "game_time_to_beats", "multiquery"].includes(path);
  }

  if (service === "steam") {
    return path === "api/storesearch/" || path === "api/appdetails";
  }

  if (service === "hltb") {
    return path === "search";
  }

  if (service === "tmdb") {
    return ["genre/movie/list", "genre/tv/list", "search/multi"].includes(path)
      || /^(movie|tv)\/\d+$/.test(path);
  }

  if (service === "google-books") {
    return path === "volumes";
  }

  if (service === "brasil-api") {
    return /^isbn\/v1\/[0-9X]+$/i.test(path);
  }

  return path === "search.json"
    || path === "api/books"
    || /^works\/OL\d+W(?:\.json|\/editions\.json)$/i.test(path)
    || /^isbn\/[0-9X-]+\.json$/i.test(path);
}

function assertSafeEndpoint(service: CatalogProxyService, endpoint: string) {
  if (
    !endpoint
    || endpoint.startsWith("/")
    || endpoint.startsWith("//")
    || endpoint.includes("://")
    || endpoint.includes("..")
    || !isAllowedEndpoint(service, endpoint)
  ) {
    throw new Error("Endpoint invalido para o proxy de catalogo.");
  }
}

function getClientIp(req: ApiRequest) {
  const forwardedFor = req.headers["x-forwarded-for"];
  const value = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;

  return value?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
}

function isWithinRateLimit(req: ApiRequest) {
  const now = Date.now();
  const clientIp = getClientIp(req);
  const current = proxyRateLimits.get(clientIp);

  if (!current || now >= current.resetAt) {
    proxyRateLimits.set(clientIp, { count: 1, resetAt: now + rateLimitWindowMs });
    return true;
  }

  if (current.count >= rateLimitMaxRequests) return false;

  current.count += 1;

  if (proxyRateLimits.size > 500) {
    for (const [key, entry] of proxyRateLimits) {
      if (now >= entry.resetAt) proxyRateLimits.delete(key);
    }
  }

  return true;
}

function logProxyRequest(service: CatalogProxyService, endpoint: string, method: string | undefined, status: number) {
  console.info("[catalog-proxy]", JSON.stringify({ service, endpoint: getEndpointPath(endpoint), method, status }));
}

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

function getRetryDelay(response: Response, attempt: number) {
  const retryAfter = Number(response.headers.get("retry-after"));

  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return Math.min(retryAfter * 1_000, 3_000);
  }

  return 250 * 2 ** attempt;
}

async function fetchWithRetry(input: string | URL, init?: RequestInit) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), upstreamTimeoutMs);

    try {
      const response = await fetch(input, { ...init, signal: controller.signal });

      if ((response.status === 429 || response.status >= 500) && attempt === 0) {
        await response.arrayBuffer();
        await delay(getRetryDelay(response, attempt));
        continue;
      }

      return response;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error("O servico de catálogo não respondeu.");
}

async function getIgdbAccessToken(clientId: string, clientSecret: string) {
  if (igdbAccessToken && Date.now() < igdbTokenExpiresAt) {
    return igdbAccessToken;
  }

  if (igdbTokenPromise) return igdbTokenPromise;

  igdbTokenPromise = (async () => {
    const response = await fetchWithRetry("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
    });

  if (!response.ok) {
    throw new Error("Não foi possível autenticar na IGDB.");
  }
    if (!response.ok) {
      throw new Error("Não foi possivel autenticar na IGDB.");
    }

    const data = (await response.json()) as TwitchTokenResponse;

    igdbAccessToken = data.access_token;
    igdbTokenExpiresAt = Date.now() + Math.max(0, data.expires_in - 60) * 1_000;

    return igdbAccessToken;
  })();

  try {
    return await igdbTokenPromise;
  } finally {
    igdbTokenPromise = null;
  }
}

async function requestIgdb(clientId: string, token: string, endpoint: string, body: string) {
  return fetchWithRetry(`https://api.igdb.com/v4/${endpoint}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Client-ID": clientId,
      "Content-Type": "text/plain",
    },
    body,
  });
}

async function fetchIgdb(req: ApiRequest, endpoint: string): Promise<ProxyFetchResult> {
  if (req.method !== "POST") {
    return { response: null, error: `Metodo ${req.method} não permitido para IGDB. Use POST.`, statusCode: 405 };
  }

  const clientId = getEnvValue("IGDB_CLIENT_ID", "VITE_IGDB_CLIENT_ID");
  const clientSecret = getEnvValue("IGDB_CLIENT_SECRET", "VITE_IGDB_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    return { response: null, error: "Configure IGDB_CLIENT_ID e IGDB_CLIENT_SECRET.", statusCode: 500 };
  }

  const body = await readRequestBody(req);

  if (!body.trim()) {
    return { response: null, error: "Query vazia para IGDB.", statusCode: 400 };
  }

  let token = await getIgdbAccessToken(clientId, clientSecret);
  let response = await requestIgdb(clientId, token, endpoint, body);

  if (response.status === 401) {
    igdbAccessToken = "";
    igdbTokenExpiresAt = 0;
    token = await getIgdbAccessToken(clientId, clientSecret);
    response = await requestIgdb(clientId, token, endpoint, body);
  }

  return { response, error: "", statusCode: response.status };
}

async function fetchSteam(req: ApiRequest, endpoint: string): Promise<ProxyFetchResult> {
  if (req.method !== "GET") {
    return { response: null, error: `Metodo ${req.method} não permitido para Steam. Use GET.`, statusCode: 405 };
  }

  const response = await fetchWithRetry(`https://store.steampowered.com/${endpoint}`);

  return { response, error: "", statusCode: response.status };
}

async function fetchHltb(req: ApiRequest, endpoint: string): Promise<ProxyFetchResult> {
  if (req.method !== "GET") {
    return { response: null, error: `Metodo ${req.method} nao permitido para HLTB. Use GET.`, statusCode: 405 };
  }

  const url = new URL(endpoint, "https://horizon.local");
  const title = url.searchParams.get("title")?.trim() ?? "";

  if (title.length < 2 || title.length > 150) {
    return { response: null, error: "Informe um titulo valido para o HLTB.", statusCode: 400 };
  }

  const result = await hltbService.search(title, { modifier: SearchModifier.HIDE_DLC });

  if (!result.success) {
    return { response: null, error: "Não foi possivel consultar o HowLongToBeat.", statusCode: 502 };
  }

  const items = result.data.slice(0, 10).map((item) => ({
    alias: item.alias,
    id: item.id,
    mainTime: item.mainTime,
    name: item.name,
    releaseYear: item.releaseYear,
    similarity: item.similarity,
    type: item.type,
  }));
  const response = new Response(JSON.stringify({ items }), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

  return { response, error: "", statusCode: 200 };
}

async function fetchTmdb(req: ApiRequest, endpoint: string): Promise<ProxyFetchResult> {
  if (req.method !== "GET") {
    return { response: null, error: `Metodo ${req.method} não permitido para TMDB. Use GET.`, statusCode: 405 };
  }

  const tmdbAccessToken = getEnvValue("TMDB_ACCESS_TOKEN", "VITE_TMDB_ACCESS_TOKEN");
  const tmdbApiKey = getEnvValue("TMDB_API_KEY", "VITE_TMDB_API_KEY");

  if (!tmdbAccessToken && !tmdbApiKey) {
    return { response: null, error: "Configure TMDB_ACCESS_TOKEN ou TMDB_API_KEY.", statusCode: 500 };
  }

  const url = new URL(endpoint, "https://api.themoviedb.org/3/");

  if (!tmdbAccessToken && tmdbApiKey) {
    url.searchParams.set("api_key", tmdbApiKey);
  }

  const response = await fetchWithRetry(url, {
    headers: tmdbAccessToken
      ? { Authorization: `Bearer ${tmdbAccessToken}`, Accept: "application/json" }
      : { Accept: "application/json" },
  });

  return { response, error: "", statusCode: response.status };
}

async function fetchGoogleBooks(req: ApiRequest, endpoint: string): Promise<ProxyFetchResult> {
  if (req.method !== "GET") {
    return { response: null, error: `Metodo ${req.method} não permitido para Google Books. Use GET.`, statusCode: 405 };
  }

  const url = new URL(endpoint, "https://www.googleapis.com/books/v1/");
  const apiKey = getEnvValue("GOOGLE_BOOKS_API_KEY");

  if (!apiKey) {
    const response = new Response(JSON.stringify({ totalItems: 0, items: [] }), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });

    return { response, error: "", statusCode: 200 };
  }

  url.searchParams.set("key", apiKey);

  const response = await fetchWithRetry(url, {
    headers: { Accept: "application/json" },
  });

  return { response, error: "", statusCode: response.status };
}

async function fetchBrasilApi(req: ApiRequest, endpoint: string): Promise<ProxyFetchResult> {
  if (req.method !== "GET") {
    return { response: null, error: `Metodo ${req.method} não permitido para BrasilAPI. Use GET.`, statusCode: 405 };
  }

  const response = await fetchWithRetry(`https://brasilapi.com.br/api/${endpoint}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Horizon/1.0",
    },
  });

  return { response, error: "", statusCode: response.status };
}

async function waitForBooksRequestSlot(intervalMs: number) {
  const scheduled = booksSchedule.then(async () => {
    const waitTime = Math.max(0, nextBooksRequestAt - Date.now());

    if (waitTime > 0) await delay(waitTime);

    nextBooksRequestAt = Date.now() + intervalMs;
  });

  booksSchedule = scheduled.catch(() => undefined);
  await scheduled;
}

async function fetchBooks(req: ApiRequest, endpoint: string): Promise<ProxyFetchResult> {
  if (req.method !== "GET") {
    return { response: null, error: `Metodo ${req.method} não permitido para Open Library. Use GET.`, statusCode: 405 };
  }

  const contact = getEnvValue("OPEN_LIBRARY_CONTACT");
  await waitForBooksRequestSlot(contact ? 350 : 1_000);

  const response = await fetchWithRetry(`https://openlibrary.org/${endpoint}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": contact ? `Horizon/1.0 (${contact})` : "Horizon/1.0",
    },
  });

  return { response, error: "", statusCode: response.status };
}

async function fetchCatalogService(service: CatalogProxyService, req: ApiRequest, endpoint: string) {
  if (service === "igdb") return fetchIgdb(req, endpoint);
  if (service === "steam") return fetchSteam(req, endpoint);
  if (service === "hltb") return fetchHltb(req, endpoint);
  if (service === "tmdb") return fetchTmdb(req, endpoint);
  if (service === "google-books") return fetchGoogleBooks(req, endpoint);
  if (service === "brasil-api") return fetchBrasilApi(req, endpoint);

  return fetchBooks(req, endpoint);
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    setCorsHeaders(res);

    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (!isWithinRateLimit(req)) {
      res.setHeader("Retry-After", "60");
      sendJson(res, 429, { ok: false, message: "Muitas consultas ao catálogo. Tente novamente em instantes." });
      return;
    }

    const { service, endpoint } = getRequestParams(req);

    if (!service && !endpoint) {
      sendJson(res, 200, { ok: true, name: "catalog-proxy" });
      return;
    }

    if (!isCatalogProxyService(service)) {
      sendJson(res, 400, { ok: false, message: "Serviço de catálogo inválido." });
      return;
    }

    assertSafeEndpoint(service, endpoint);

    const { response, error, statusCode } = await fetchCatalogService(service, req, endpoint);

    if (!response) {
      logProxyRequest(service, endpoint, req.method, statusCode);
      sendJson(res, statusCode, { ok: false, service, method: req.method, message: error });
      return;
    }

    logProxyRequest(service, endpoint, req.method, statusCode);
    await pipeFetchResponse(res, response, req.method === "GET");
  } catch (error) {
    console.error("[catalog-proxy]", error);
    sendJson(res, isAbortError(error) ? 504 : 500, {
      ok: false,
      message: isAbortError(error)
        ? "O servico de catálogo demorou demais para responder."
        : error instanceof Error ? error.message : "Erro ao consultar catálogo.",
    });
  }
}

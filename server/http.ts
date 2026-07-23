import type { IncomingMessage, ServerResponse } from "node:http";

export type ApiRequest = IncomingMessage & { body?: unknown };

const NATIVE_APP_ORIGINS = new Set(["https://localhost", "capacitor://localhost"]);

function isAllowedApiOrigin(origin: string) {
  if (NATIVE_APP_ORIGINS.has(origin)) return true;

  const siteUrl = (process.env.SITE_URL ?? process.env.VITE_SITE_URL ?? "").replace(/\/+$/, "");
  return Boolean(siteUrl) && origin === siteUrl;
}

export function handleCorsPreflight(req: ApiRequest, res: ServerResponse, methods: string[]) {
  const origin = req.headers.origin;
  if (origin && isAllowedApiOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", methods.join(", "));
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Vercel-Protection-Bypass");
    res.setHeader("Access-Control-Max-Age", "86400");
    res.setHeader("Vary", "Origin");
  }

  if (req.method !== "OPTIONS") return false;

  res.statusCode = origin && isAllowedApiOrigin(origin) ? 204 : 403;
  res.end();
  return true;
}

export function sendJson(res: ServerResponse, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

export function redirect(res: ServerResponse, location: string) {
  res.statusCode = 302;
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Location", location);
  res.end();
}

export function getBearerToken(req: ApiRequest) {
  const authorization = req.headers.authorization ?? "";

  return authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
}

export async function readJsonBody<T>(req: ApiRequest, maxBytes = 32_000): Promise<T | null> {
  let body = req.body;

  if (body === undefined) {
    const chunks: Buffer[] = [];
    let receivedBytes = 0;

    for await (const chunk of req) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);

      receivedBytes += buffer.length;
      if (receivedBytes > maxBytes) return null;
      chunks.push(buffer);
    }

    body = Buffer.concat(chunks).toString("utf8");
  }

  if (Buffer.isBuffer(body)) body = body.toString("utf8");

  if (typeof body === "string") {
    try {
      body = JSON.parse(body) as unknown;
    } catch {
      return null;
    }
  }

  return body && typeof body === "object" ? body as T : null;
}

export function getRequestOrigin(req: IncomingMessage) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto)?.split(",")[0]?.trim()
    || (process.env.VERCEL ? "https" : "http");
  const host = req.headers["x-forwarded-host"] ?? req.headers.host;
  const normalizedHost = Array.isArray(host) ? host[0] : host;

  if (normalizedHost) return `${protocol}://${normalizedHost}`;

  return process.env.SITE_URL ?? process.env.VITE_SITE_URL ?? "http://localhost:5173";
}

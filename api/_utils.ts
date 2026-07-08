import type { IncomingMessage, ServerResponse } from "node:http";

export type ApiRequest = IncomingMessage & {
  body?: unknown;
};

export type ApiResponse = ServerResponse & {
  status?: (statusCode: number) => ApiResponse;
  send?: (body: unknown) => void;
};

export function sendResponse(res: ApiResponse, statusCode: number, body: string, contentType = "text/plain") {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", contentType);
  res.end(body);
}

export function sendMethodNotAllowed(res: ApiResponse) {
  sendResponse(res, 405, "Method not allowed");
}

export function getProxyEndpoint(req: ApiRequest, proxyPrefix: string) {
  const url = new URL(req.url ?? "", "https://horizon.local");
  const publicPrefix = proxyPrefix.replace(/^\/api/, "");
  const prefixes = [proxyPrefix, publicPrefix];
  const pathname = prefixes.reduce((currentPath, prefix) => {
    if (currentPath.startsWith(prefix)) {
      return currentPath.slice(prefix.length);
    }

    return currentPath;
  }, url.pathname);

  return `${pathname.replace(/^\//, "")}${url.search}`;
}

export async function readRequestBody(req: ApiRequest) {
  if (typeof req.body === "string") return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");
  if (req.body && typeof req.body === "object") return JSON.stringify(req.body);

  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on("data", (chunk) => {
      chunks.push(Buffer.from(chunk));
    });

    req.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });

    req.on("error", reject);
  });
}

export async function pipeFetchResponse(res: ApiResponse, response: Response) {
  const content = await response.text();

  res.statusCode = response.status;
  res.setHeader("Content-Type", response.headers.get("content-type") ?? "application/json");
  res.end(content);
}

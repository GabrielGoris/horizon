import { createClient } from "@supabase/supabase-js";
import type { IncomingMessage, ServerResponse } from "node:http";

if (!process.env.VERCEL) {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // Vercel CLI may already have loaded the local environment.
  }
}

type ApiRequest = IncomingMessage & { body?: unknown };

type CheckEmailBody = {
  email?: unknown;
};

const USERS_PER_PAGE = 1_000;

function sendJson(res: ServerResponse, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

async function readRequestBody(req: ApiRequest): Promise<CheckEmailBody | null> {
  let body = req.body;

  if (body === undefined) {
    const chunks: Buffer[] = [];

    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
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

  return body && typeof body === "object" ? body as CheckEmailBody : null;
}

export default async function handler(req: ApiRequest, res: ServerResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendJson(res, 405, { ok: false, message: "Método não permitido." });
    return;
  }

  const body = await readRequestBody(req);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email) {
    sendJson(res, 400, { ok: false, message: "Informe um e-mail válido." });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    ?? process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    console.error("[check-email] Missing Supabase server credentials.");
    sendJson(res, 500, { ok: false, message: "Não foi possível verificar o e-mail agora." });
    return;
  }

  const adminClient = createClient(supabaseUrl, supabaseSecretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (let page = 1; ; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage: USERS_PER_PAGE,
    });

    if (error) {
      console.error("[check-email] Supabase listUsers failed:", error.message);
      sendJson(res, 500, { ok: false, message: "Não foi possível verificar o e-mail agora." });
      return;
    }

    const emailExists = data.users.some((user) => user.email?.trim().toLowerCase() === email);

    if (emailExists) {
      sendJson(res, 200, { ok: true, exists: true });
      return;
    }

    if (data.users.length < USERS_PER_PAGE) {
      sendJson(res, 200, { ok: true, exists: false });
      return;
    }
  }
}

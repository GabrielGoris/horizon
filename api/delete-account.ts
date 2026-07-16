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

type DeleteAccountBody = {
  email?: unknown;
  password?: unknown;
};

function sendJson(res: ServerResponse, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function getBearerToken(req: ApiRequest) {
  const authorization = req.headers.authorization ?? "";

  return authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
}

async function readRequestBody(req: ApiRequest): Promise<DeleteAccountBody | null> {
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

  return body && typeof body === "object" ? body as DeleteAccountBody : null;
}

export default async function handler(req: ApiRequest, res: ServerResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendJson(res, 405, { ok: false, message: "Método não permitido." });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const supabasePublicKey = process.env.SUPABASE_ANON_KEY
    ?? process.env.SUPABASE_PUBLISHABLE_KEY
    ?? process.env.VITE_SUPABASE_ANON_KEY;
  const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    ?? process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabasePublicKey || !supabaseSecretKey) {
    console.error("[delete-account] Missing Supabase server credentials.");
    sendJson(res, 500, { ok: false, message: "Serviço de exclusão indisponível." });
    return;
  }

  const accessToken = getBearerToken(req);
  const body = await readRequestBody(req);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!accessToken) {
    sendJson(res, 401, { ok: false, message: "Sua sessão expirou. Entre novamente e tente excluir a conta." });
    return;
  }

  if (!email || !password) {
    sendJson(res, 400, { ok: false, message: "Informe seu e-mail e sua senha." });
    return;
  }

  const sessionClient = createClient(supabaseUrl, supabasePublicKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const credentialsClient = createClient(supabaseUrl, supabasePublicKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const adminClient = createClient(supabaseUrl, supabaseSecretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: sessionData, error: sessionError } = await sessionClient.auth.getUser();

  if (sessionError || !sessionData.user) {
    sendJson(res, 401, { ok: false, message: "Sua sessão expirou. Entre novamente e tente excluir a conta." });
    return;
  }

  if (sessionData.user.email?.toLowerCase() !== email) {
    sendJson(res, 400, { ok: false, message: "O e-mail informado não corresponde à conta atual." });
    return;
  }

  const { data: credentialsData, error: credentialsError } = await credentialsClient.auth.signInWithPassword({
    email,
    password,
  });

  if (credentialsError || credentialsData.user?.id !== sessionData.user.id) {
    sendJson(res, 401, { ok: false, message: "E-mail ou senha incorretos." });
    return;
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(sessionData.user.id);

  if (deleteError) {
    console.error("[delete-account] Supabase deleteUser failed:", deleteError.message);
    sendJson(res, 500, { ok: false, message: "Não foi possível excluir a conta agora." });
    return;
  }

  sendJson(res, 200, { ok: true });
}

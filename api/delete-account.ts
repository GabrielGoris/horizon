import { createClient } from "@supabase/supabase-js";
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

function sendJson(res: ServerResponse, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function getBearerToken(req: ApiRequest) {
  const authorization = req.headers.authorization ?? "";

  if (!authorization.startsWith("Bearer ")) {
    return "";
  }

  return authorization.slice("Bearer ".length).trim();
}

export default async function handler(req: ApiRequest, res: ServerResponse) {
  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, message: "Metodo nao permitido." });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    sendJson(res, 500, {
      ok: false,
      message: "Configure SUPABASE_SERVICE_ROLE_KEY no ambiente do servidor.",
    });
    return;
  }

  const accessToken = getBearerToken(req);

  if (!accessToken) {
    sendJson(res, 401, { ok: false, message: "Sessao nao informada." });
    return;
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { data, error: userError } = await userClient.auth.getUser();

  if (userError || !data.user) {
    sendJson(res, 401, { ok: false, message: "Sessao invalida." });
    return;
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(data.user.id);

  if (deleteError) {
    sendJson(res, 500, {
      ok: false,
      message: deleteError.message || "Não foi possível excluir a conta.",
    });
    return;
  }

  sendJson(res, 200, { ok: true });
}

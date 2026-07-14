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

function sendJson(res: ServerResponse, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function getBearerToken(req: ApiRequest) {
  const authorization = req.headers.authorization ?? "";
  if (!authorization.startsWith("Bearer ")) return "";
  return authorization.slice("Bearer ".length).trim();
}

function getTokenClaims(accessToken: string) {
  try {
    const payload = accessToken.split(".")[1];
    if (!payload) return null;

    const decodedPayload = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      aal?: unknown;
      iat?: unknown;
    };

    return {
      assuranceLevel: typeof decodedPayload.aal === "string" ? decodedPayload.aal : null,
      issuedAt: typeof decodedPayload.iat === "number" ? decodedPayload.iat : null,
    };
  } catch {
    return null;
  }
}

export default async function handler(req: ApiRequest, res: ServerResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendJson(res, 405, { ok: false, message: "Método não permitido." });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    sendJson(res, 500, { ok: false, message: "Servico de exclusao indisponivel." });
    return;
  }

  const accessToken = getBearerToken(req);
  if (!accessToken) {
    sendJson(res, 401, { ok: false, message: "Sessão não informada." });
    return;
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error: userError } = await userClient.auth.getUser();

  if (userError || !data.user) {
    sendJson(res, 401, { ok: false, message: "Sessao invalida." });
    return;
  }

  const tokenClaims = getTokenClaims(accessToken);
  const maximumAuthenticationAgeInSeconds = 5 * 60;

  if (!tokenClaims?.issuedAt || Math.floor(Date.now() / 1000) - tokenClaims.issuedAt > maximumAuthenticationAgeInSeconds) {
    sendJson(res, 403, {
      ok: false,
      message: "Confirme sua identidade novamente antes de excluir a conta.",
    });
    return;
  }

  const { data: factors, error: factorsError } = await userClient.auth.mfa.listFactors();
  if (factorsError) {
    sendJson(res, 500, { ok: false, message: "não foi possivel validar a segunda etapa." });
    return;
  }

  const hasVerifiedFactor = factors.all.some((factor) => factor.status === "verified");
  if (hasVerifiedFactor && tokenClaims.assuranceLevel !== "aal2") {
    sendJson(res, 403, { ok: false, message: "Conclua a verificação em duas etapas antes de excluir a conta." });
    return;
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(data.user.id);
  if (deleteError) {
    sendJson(res, 500, { ok: false, message: "não foi possivel excluir a conta." });
    return;
  }

  sendJson(res, 200, { ok: true });
}

import type { ServerResponse } from "node:http";
import type { ApiRequest } from "../server/http.js";
import { handleCorsPreflight, readJsonBody, sendJson } from "../server/http.js";
import { authenticateRequest, getSupabaseServerClients } from "../server/supabaseAdmin.js";

if (!process.env.VERCEL) {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // The local environment may already have loaded the variables.
  }
}

type PushDeviceInput = {
  token?: unknown;
  timezone?: unknown;
};

function getInputValue(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength
    ? value.trim()
    : null;
}

export default async function handler(req: ApiRequest, res: ServerResponse) {
  if (handleCorsPreflight(req, res, ["POST", "DELETE", "OPTIONS"])) return;

  if (req.method !== "POST" && req.method !== "DELETE") {
    res.setHeader("Allow", "POST, DELETE");
    sendJson(res, 405, { ok: false, message: "Método não permitido." });
    return;
  }

  const clients = getSupabaseServerClients();
  if (!clients) {
    sendJson(res, 503, { ok: false, message: "Serviço de notificações indisponível." });
    return;
  }

  const user = await authenticateRequest(req, clients);
  if (!user) {
    sendJson(res, 401, { ok: false, message: "Sua sessão expirou. Entre novamente e tente continuar." });
    return;
  }

  const body = await readJsonBody<PushDeviceInput>(req);
  const token = getInputValue(body?.token, 4_096);
  if (!token) {
    sendJson(res, 400, { ok: false, message: "Dispositivo de notificações inválido." });
    return;
  }

  if (req.method === "DELETE") {
    const { error } = await clients.adminClient
      .from("push_devices")
      .delete()
      .eq("user_id", user.id)
      .eq("token", token);

    if (error) {
      console.error("[push-devices] Failed to remove token:", error.message);
      sendJson(res, 500, { ok: false, message: "Não foi possível remover este dispositivo." });
      return;
    }

    sendJson(res, 200, { ok: true });
    return;
  }

  const timezone = getInputValue(body?.timezone, 100) ?? "UTC";
  const now = new Date().toISOString();
  const { error } = await clients.adminClient
    .from("push_devices")
    .upsert({
      last_seen_at: now,
      platform: "android",
      token,
      timezone,
      updated_at: now,
      user_id: user.id,
    }, { onConflict: "token" });

  if (error) {
    console.error("[push-devices] Failed to save token:", error.message);
    sendJson(res, 500, { ok: false, message: "Não foi possível salvar este dispositivo." });
    return;
  }

  sendJson(res, 200, { ok: true });
}

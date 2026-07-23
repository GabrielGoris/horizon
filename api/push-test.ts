import type { ServerResponse } from "node:http";
import type { ApiRequest } from "../server/http.js";
import { sendJson } from "../server/http.js";
import { sendPushMessage } from "../server/pushNotifications.js";
import { authenticateRequest, getSupabaseServerClients } from "../server/supabaseAdmin.js";

if (!process.env.VERCEL) {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // The local environment may already have loaded the variables.
  }
}

type PushDevice = { token: string };

export default async function handler(req: ApiRequest, res: ServerResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
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

  const { data: devices, error: devicesError } = await clients.adminClient
    .from("push_devices")
    .select("token")
    .eq("user_id", user.id);

  if (devicesError) {
    console.error("[push-test] Failed to load devices:", devicesError.message);
    sendJson(res, 500, { ok: false, message: "Não foi possível localizar este dispositivo." });
    return;
  }

  const tokens = (devices ?? []).map((device) => (device as PushDevice).token);
  if (tokens.length === 0) {
    sendJson(res, 409, { ok: false, message: "Este dispositivo ainda não está registrado para notificações." });
    return;
  }

  const result = await sendPushMessage(tokens, {
    body: "O Horizon está pronto para acompanhar o seu acervo.",
    channelId: "horizon_library",
    route: "/settings/notifications",
    tag: `push-test-${user.id}`,
    title: "Notificações ativadas",
  });

  if (result.invalidTokens.length > 0) {
    const { error } = await clients.adminClient
      .from("push_devices")
      .delete()
      .in("token", result.invalidTokens);

    if (error) console.warn("[push-test] Failed to remove expired tokens:", error.message);
  }

  if (result.sentCount === 0) {
    sendJson(res, 503, { ok: false, message: "Não foi possível entregar a notificação. Tente abrir o Horizon novamente." });
    return;
  }

  sendJson(res, 200, { ok: true });
}

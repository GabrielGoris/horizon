import type { ServerResponse } from "node:http";
import type { ApiRequest } from "../server/http.js";
import { readJsonBody, sendJson } from "../server/http.js";
import { sendUserPushOnce } from "../server/pushDelivery.js";
import { isPushMessagingConfigured } from "../server/pushNotifications.js";
import { authenticateRequest, getSupabaseServerClients } from "../server/supabaseAdmin.js";

type SteamSyncPayload = {
  event?: unknown;
  gameCount?: unknown;
};

function getCurrentDay() {
  return new Date().toISOString().slice(0, 10);
}

export default async function handler(req: ApiRequest, res: ServerResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendJson(res, 405, { ok: false, message: "Método não permitido." });
    return;
  }

  const clients = getSupabaseServerClients();
  if (!clients || !isPushMessagingConfigured()) {
    sendJson(res, 503, { ok: false, message: "Serviço de notificações indisponível." });
    return;
  }

  const user = await authenticateRequest(req, clients);
  if (!user) {
    sendJson(res, 401, { ok: false, message: "Sua sessão expirou. Entre novamente e tente continuar." });
    return;
  }

  const payload = await readJsonBody<SteamSyncPayload>(req);
  const event = payload?.event;

  if (event !== "discovered" && event !== "failed") {
    sendJson(res, 400, { ok: false, message: "Evento de sincronização inválido." });
    return;
  }

  const gameCount = typeof payload?.gameCount === "number" && Number.isInteger(payload.gameCount)
    ? Math.max(0, Math.min(payload.gameCount, 999))
    : 0;
  const isDiscovery = event === "discovered";

  try {
    const result = await sendUserPushOnce(clients.adminClient, {
      kind: isDiscovery ? "steam_discovery" : "steam_sync_failure",
      periodStart: getCurrentDay(),
      userId: user.id,
    }, {
      body: isDiscovery
        ? `${gameCount === 1 ? "Encontramos 1 jogo novo" : `Encontramos ${gameCount} jogos novos`} na sua biblioteca Steam.`
        : "Não foi possí­vel sincronizar sua biblioteca Steam. Abra o Horizon para tentar novamente.",
      channelId: "horizon_library",
      route: isDiscovery ? "/games" : "/settings/integrations",
      tag: `steam-${event}-${user.id}`,
      title: isDiscovery ? "Novidades da Steam" : "Sincronização da Steam",
    });

    sendJson(res, 200, { ok: true, sent: result.sentCount });
  } catch (error) {
    console.error("[push-steam-sync] Failed to send notification:", error);
    sendJson(res, 500, { ok: false, message: "Não foi possÃível enviar a notificação da Steam." });
  }
}

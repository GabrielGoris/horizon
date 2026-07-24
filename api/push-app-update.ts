import type { ServerResponse } from "node:http";
import type { ApiRequest } from "../server/http.js";
import { readJsonBody, sendJson } from "../server/http.js";
import { sendGlobalPushOnce } from "../server/pushDelivery.js";
import { isPushMessagingConfigured } from "../server/pushNotifications.js";
import { getSupabaseServerClients } from "../server/supabaseAdmin.js";

type AppUpdatePayload = { version?: unknown };

function isAuthorizedReleaseRequest(req: ApiRequest) {
  const secret = process.env.PUSH_NOTIFICATION_SECRET;
  return Boolean(secret) && req.headers.authorization === `Bearer ${secret}`;
}

export default async function handler(req: ApiRequest, res: ServerResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendJson(res, 405, { ok: false, message: "Método não permitido." });
    return;
  }

  if (!isAuthorizedReleaseRequest(req)) {
    sendJson(res, 401, { ok: false, message: "Não autorizado." });
    return;
  }

  const payload = await readJsonBody<AppUpdatePayload>(req);
  const version = typeof payload?.version === "string" ? payload.version.trim().replace(/^v/i, "") : "";

  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    sendJson(res, 400, { ok: false, message: "Versão inválida." });
    return;
  }

  const clients = getSupabaseServerClients();
  if (!clients || !isPushMessagingConfigured()) {
    sendJson(res, 503, { ok: false, message: "Serviço de notificações indisponí­vel." });
    return;
  }

  try {
    const result = await sendGlobalPushOnce(clients.adminClient, {
      kind: `app_update:${version}`,
      periodStart: "2000-01-01",
    }, {
      body: `A versÃ£o ${version} está pronta para baixar.`,
      channelId: "horizon_library",
      route: "/",
      tag: `app-update-${version}`,
      title: "Atualização do Horizon",
    });

    sendJson(res, 200, { ok: true, sent: result.sentCount });
  } catch (error) {
    console.error("[push-app-update] Failed to send update notification:", error);
    sendJson(res, 500, { ok: false, message: "Não foi possí­vel enviar a atualização." });
  }
}

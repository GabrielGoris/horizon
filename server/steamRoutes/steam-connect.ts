import type { ServerResponse } from "node:http";
import type { ApiRequest } from "../http";
import { getRequestOrigin, sendJson } from "../http";
import { authenticateRequest, getSupabaseServerClients } from "../supabaseAdmin";
import { createOauthState, getSteamApiKey, getSteamAuthorizationUrl } from "../steam";

if (!process.env.VERCEL) {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // The local environment may already be loaded.
  }
}

export default async function handler(req: ApiRequest, res: ServerResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendJson(res, 405, { ok: false, message: "Método não permitido." });
    return;
  }

  const clients = getSupabaseServerClients();

  if (!clients || !getSteamApiKey()) {
    console.error("[steam-connect] Missing server credentials.");
    sendJson(res, 500, { ok: false, message: "Integração com a Steam indisponível." });
    return;
  }

  const user = await authenticateRequest(req, clients);

  if (!user) {
    sendJson(res, 401, { ok: false, message: "Sua sessão expirou. Entre novamente." });
    return;
  }

  const state = createOauthState();
  const { error } = await clients.adminClient.from("steam_oauth_states").insert({
    state_hash: state.hash,
    user_id: user.id,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });

  if (error) {
    console.error("[steam-connect] Failed to persist OAuth state:", error.message);
    sendJson(res, 500, { ok: false, message: "Não foi possível iniciar a conexão com a Steam." });
    return;
  }

  const origin = getRequestOrigin(req);
  const callbackUrl = new URL("/api/steam-callback", origin);

  callbackUrl.searchParams.set("state", state.value);

  sendJson(res, 200, {
    ok: true,
    authorizationUrl: getSteamAuthorizationUrl(callbackUrl.toString(), origin),
  });
}

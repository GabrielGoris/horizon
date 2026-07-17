import type { ServerResponse } from "node:http";
import type { ApiRequest } from "../http.js";
import { getRequestOrigin, redirect } from "../http.js";
import { getSupabaseServerClients } from "../supabaseAdmin.js";
import { getSteamApiKey, getSteamPlayerSummary, hashOauthState, verifySteamCallback } from "../steam.js";

if (!process.env.VERCEL) {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // The local environment may already be loaded.
  }
}

function redirectToSettings(res: ServerResponse, origin: string, status: "connected" | "error") {
  redirect(res, new URL(`/settings/integrations?steam=${status}`, origin).toString());
}

export default async function handler(req: ApiRequest, res: ServerResponse) {
  const origin = getRequestOrigin(req);

  if (req.method !== "GET") {
    redirectToSettings(res, origin, "error");
    return;
  }

  const clients = getSupabaseServerClients();
  const apiKey = getSteamApiKey();

  if (!clients || !apiKey) {
    console.error("[steam-callback] Missing server credentials.");
    redirectToSettings(res, origin, "error");
    return;
  }

  const callbackUrl = new URL(req.url ?? "/", origin);
  const state = callbackUrl.searchParams.get("state") ?? "";

  if (!state) {
    redirectToSettings(res, origin, "error");
    return;
  }

  const stateHash = hashOauthState(state);
  const { data: oauthState, error: stateError } = await clients.adminClient
    .from("steam_oauth_states")
    .select("user_id, expires_at")
    .eq("state_hash", stateHash)
    .maybeSingle();

  await clients.adminClient.from("steam_oauth_states").delete().eq("state_hash", stateHash);

  if (stateError || !oauthState || new Date(oauthState.expires_at).getTime() <= Date.now()) {
    redirectToSettings(res, origin, "error");
    return;
  }

  try {
    const steamId = await verifySteamCallback(callbackUrl);

    if (!steamId) {
      redirectToSettings(res, origin, "error");
      return;
    }

    const profile = await getSteamPlayerSummary(steamId, apiKey);
    const { error } = await clients.adminClient.from("steam_connections").upsert({
      user_id: oauthState.user_id,
      steam_id: steamId,
      display_name: profile?.personaname ?? null,
      avatar_url: profile?.avatarfull ?? null,
      profile_url: profile?.profileurl ?? null,
      connected_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    if (error) throw error;

    redirectToSettings(res, origin, "connected");
  } catch (error) {
    console.error("[steam-callback] Failed to connect Steam:", error);
    redirectToSettings(res, origin, "error");
  }
}

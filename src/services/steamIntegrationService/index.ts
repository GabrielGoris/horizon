import type { Session } from "@supabase/supabase-js";
import type { ApiResponse, SteamEnrichmentResult, SteamIntegrationState, SteamSyncResult } from "./types";


async function requestSteamApi<T>(session: Session, path: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      ...init?.headers,
    },
  });
  const result = await response.json().catch(() => ({ ok: false })) as ApiResponse<T>;

  if (!response.ok) throw new Error(result.message ?? "Não foi possível acessar a integração com a Steam.");

  return result;
}

export async function getSteamIntegrationState(session: Session) {
  const result = await requestSteamApi<SteamIntegrationState>(session, "/api/steam-library");

  return {
    connection: result.connection,
    incompleteGames: result.incompleteGames ?? [],
  };
}

export async function startSteamConnection(session: Session) {
  const result = await requestSteamApi<{ authorizationUrl: string }>(session, "/api/steam-connect", {
    method: "POST",
  });

  return result.authorizationUrl;
}

export async function syncSteamLibrary(session: Session) {
  const result = await requestSteamApi<{ result: SteamSyncResult }>(session, "/api/steam-library", {
    method: "POST",
  });

  return result.result;
}

export async function enrichSteamGames(session: Session, appIds: number[]) {
  const result = await requestSteamApi<SteamEnrichmentResult>(session, "/api/steam-enrich", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ appIds }),
  });

  return {
    enriched: result.enriched,
    failed: result.failed,
    failedGames: result.failedGames ?? [],
  };
}

export async function disconnectSteam(session: Session) {
  await requestSteamApi<Record<string, never>>(session, "/api/steam-library", { method: "DELETE" });
}

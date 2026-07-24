import { Capacitor, CapacitorHttp } from "@capacitor/core";
import type { Session } from "@supabase/supabase-js";
import { getApiUrl } from "../apiUrl";
import type { ApiResponse, SteamEnrichmentResult, SteamIntegrationState, SteamSyncResult } from "./types";

export type {
  SteamConnection,
  SteamDiscoveredGame,
  SteamEnrichmentFailure,
  SteamEnrichmentResult,
  SteamIntegrationState,
  SteamSyncResult,
} from "./types";

async function requestSteamApi<T>(session: Session, path: string, init?: RequestInit) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${session.access_token}`,
  };
  new Headers(init?.headers).forEach((value, key) => {
    headers[key] = value;
  });
  let result: ApiResponse<T>;
  let isSuccessful: boolean;

  if (Capacitor.isNativePlatform()) {
    const response = await CapacitorHttp.request({
      data: init?.body ? JSON.parse(String(init.body)) : undefined,
      headers,
      method: init?.method ?? "GET",
      responseType: "json",
      url: getApiUrl(path),
    });

    result = response.data && typeof response.data === "object"
      ? response.data as ApiResponse<T>
      : { ok: false } as ApiResponse<T>;
    isSuccessful = response.status >= 200 && response.status < 300;
  } else {
    const response = await fetch(getApiUrl(path), {
      ...init,
      headers,
    });

    result = await response.json().catch(() => ({ ok: false })) as ApiResponse<T>;
    isSuccessful = response.ok;
  }

  if (!isSuccessful) throw new Error(result.message ?? "Não foi possível acessar a integração com a Steam.");

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

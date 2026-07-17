import type { ServerResponse } from "node:http";
import type { ApiRequest } from "../../server/http";
import { sendJson } from "../../server/http";
import { authenticateRequest, getSupabaseServerClients } from "../../server/supabaseAdmin";
import {
  getSteamApiKey,
  getSteamLibraryBackdrop,
  getSteamLibraryCover,
  getSteamOwnedGames,
  normalizeTitle,
  type SteamConnection,
  type SteamOwnedGame,
} from "../../server/steam";
import { getIncompleteSteamGames, needsSteamEnrichment } from "../../server/steamEnrichment";

export const config = { maxDuration: 60 };

if (!process.env.VERCEL) {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // The local environment may already be loaded.
  }
}

type ExistingGame = {
  added_at: string | null;
  backdrop: string | null;
  campaign_hours: number | string | null;
  category: string | null;
  cover: string | null;
  creator: string | null;
  description: string | null;
  director: string | null;
  enrichment_checked_at: string | null;
  external_id: string | null;
  hidden_at: string | null;
  id: string;
  meta: string | null;
  release_year: string | null;
  source: string | null;
  status: "complete" | "dropped" | "in_progress" | "queue";
  title: string;
};

type ImportedMedia = {
  external_id: string;
  id: string;
};

function getRequestErrorMessage(error: unknown, method: string) {
  const databaseError = error && typeof error === "object"
    ? error as { code?: unknown; message?: unknown }
    : null;
  const code = typeof databaseError?.code === "string" ? databaseError.code : "";
  const detail = typeof databaseError?.message === "string" ? databaseError.message : "";

  if (detail.includes("hidden_at")) {
    return "O banco ainda não possui o controle de jogos ignorados da Steam.";
  }
  if (detail.includes("enrichment_checked_at")) {
    return "O banco ainda não possui o controle de detalhamento da Steam.";
  }

  if (code === "23502" && detail.includes("finished_at")) {
    return "O banco ainda exige uma data de conclusão para salvar horas. Aplique a migração allow_playtime_without_completion e tente novamente.";
  }

  if (code === "PGRST205") {
    return "As tabelas da integração Steam ainda não existem no banco. Aplique as migrações do Supabase e tente novamente.";
  }

  if (error instanceof Error && error.message.includes("biblioteca Steam não está pública")) {
    return "A Steam não liberou sua biblioteca. Deixe os detalhes de jogos do perfil como públicos e tente novamente.";
  }

  if (method === "GET") return "Não foi possível carregar sua conexão com a Steam.";
  if (method === "DELETE") return "Não foi possível desconectar sua conta Steam.";

  return "Não foi possível salvar sua biblioteca Steam no Horizon.";
}

function toImportPayload(game: SteamOwnedGame, userId: string, existing?: ExistingGame) {
  return {
    user_id: userId,
    title: game.name,
    type: "games",
    status: existing?.status ?? "queue",
    creator: existing?.creator ?? null,
    director: existing?.director ?? null,
    category: existing?.category ?? null,
    cover: existing?.cover || getSteamLibraryCover(game.appid),
    backdrop: existing?.backdrop || getSteamLibraryBackdrop(game.appid),
    release_year: existing?.release_year ?? null,
    added_at: existing?.added_at ?? new Date().toISOString().slice(0, 10),
    meta: existing?.meta || "Steam",
    description: existing?.description ?? null,
    source: "steam",
    external_id: String(game.appid),
  };
}

async function getConnection(
  userId: string,
  adminClient: NonNullable<ReturnType<typeof getSupabaseServerClients>>["adminClient"],
) {
  const { data, error } = await adminClient
    .from("steam_connections")
    .select("steam_id, display_name, avatar_url, profile_url, connected_at, last_synced_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  return data as SteamConnection | null;
}

async function getIncompleteGames(
  userId: string,
  adminClient: NonNullable<ReturnType<typeof getSupabaseServerClients>>["adminClient"],
) {
  const { data, error } = await adminClient
    .from("media_items")
    .select("id, title, creator, category, description, release_year, campaign_hours, external_id")
    .eq("user_id", userId)
    .eq("type", "games")
    .eq("source", "steam")
    .is("hidden_at", null);

  if (error) throw error;

  return getIncompleteSteamGames(data ?? []);
}

async function synchronizeLibrary(
  userId: string,
  steamId: string,
  adminClient: NonNullable<ReturnType<typeof getSupabaseServerClients>>["adminClient"],
  apiKey: string,
) {
  const games = (await getSteamOwnedGames(steamId, apiKey))
    .filter((game) => Number.isInteger(game.appid) && typeof game.name === "string" && Boolean(game.name.trim()));
  const { data: existingRows, error: existingError } = await adminClient
    .from("media_items")
    .select("id, title, status, creator, director, category, cover, backdrop, release_year, campaign_hours, added_at, meta, description, source, external_id, enrichment_checked_at, hidden_at")
    .eq("user_id", userId)
    .eq("type", "games");

  if (existingError) throw existingError;

  const existingGames = (existingRows ?? []) as ExistingGame[];
  const existingByExternalId = new Map(
    existingGames
      .filter((game) => game.source === "steam" && game.external_id)
      .map((game) => [game.external_id as string, game]),
  );
  const existingByTitle = new Map(existingGames.map((game) => [normalizeTitle(game.title), game]));
  const linkedManually = new Map<string, ExistingGame>();
  const claimedManualIds = new Set<string>();

  for (const game of games) {
    const externalId = String(game.appid);

    if (existingByExternalId.has(externalId)) continue;

    const titleMatch = existingByTitle.get(normalizeTitle(game.name));

    const normalizedPlatform = titleMatch?.meta?.trim().toLocaleLowerCase("pt-BR") ?? "";

    if (
      !titleMatch
      || titleMatch.source
      || titleMatch.external_id
      || claimedManualIds.has(titleMatch.id)
      || (normalizedPlatform && normalizedPlatform !== "steam")
    ) continue;

    const { error } = await adminClient
      .from("media_items")
      .update({
        source: "steam",
        external_id: externalId,
        cover: titleMatch.cover || getSteamLibraryCover(game.appid),
        backdrop: titleMatch.backdrop || getSteamLibraryBackdrop(game.appid),
      })
      .eq("id", titleMatch.id)
      .eq("user_id", userId);

    if (error) throw error;

    linkedManually.set(externalId, { ...titleMatch, source: "steam", external_id: externalId });
    claimedManualIds.add(titleMatch.id);
  }

  const discoveredGames = games.filter((game) => (
    !existingByExternalId.has(String(game.appid))
    && !linkedManually.has(String(game.appid))
  ));
  const activeGames = games.filter((game) => !existingByExternalId.get(String(game.appid))?.hidden_at);
  const payload = activeGames
    .filter((game) => !linkedManually.has(String(game.appid)))
    .map((game) => toImportPayload(game, userId, existingByExternalId.get(String(game.appid))));
  const importedRows: ImportedMedia[] = [];

  for (let index = 0; index < payload.length; index += 200) {
    const { data, error } = await adminClient
      .from("media_items")
      .upsert(payload.slice(index, index + 200), { onConflict: "user_id,source,external_id" })
      .select("id, external_id");

    if (error) throw error;
    importedRows.push(...(data as ImportedMedia[]));
  }

  const mediaIdByExternalId = new Map(importedRows.map((row) => [row.external_id, row.id]));

  linkedManually.forEach((row, externalId) => mediaIdByExternalId.set(externalId, row.id));

  const completions = activeGames
    .filter((game) => (game.playtime_forever ?? 0) > 0 && mediaIdByExternalId.has(String(game.appid)))
    .map((game) => ({
      media_item_id: mediaIdByExternalId.get(String(game.appid)),
      hours_played: Number(((game.playtime_forever ?? 0) / 60).toFixed(2)),
    }));

  for (let index = 0; index < completions.length; index += 200) {
    const { error } = await adminClient
      .from("game_completions")
      .upsert(completions.slice(index, index + 200), { onConflict: "media_item_id" });

    if (error) throw error;
  }

  const syncedAt = new Date().toISOString();
  const { error: connectionError } = await adminClient
    .from("steam_connections")
    .update({ last_synced_at: syncedAt })
    .eq("user_id", userId);

  if (connectionError) throw connectionError;

  const enrichmentAppIds = activeGames
    .filter((game) => {
      const existing = existingByExternalId.get(String(game.appid))
        ?? linkedManually.get(String(game.appid));

      return needsSteamEnrichment(existing);
    })
    .map((game) => game.appid);
  const incompleteGames = await getIncompleteGames(userId, adminClient);

  return {
    added: discoveredGames.length,
    enrichmentAppIds,
    incompleteGames,
    linked: linkedManually.size,
    newGames: discoveredGames.map((game) => ({
      appId: game.appid,
      cover: getSteamLibraryCover(game.appid),
      playtimeHours: Number(((game.playtime_forever ?? 0) / 60).toFixed(2)),
      title: game.name,
    })),
    syncedAt,
    total: games.length,
    updated: activeGames.filter((game) => existingByExternalId.has(String(game.appid))).length,
  };
}

export default async function handler(req: ApiRequest, res: ServerResponse) {
  if (!req.method || !["GET", "POST", "DELETE"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST, DELETE");
    sendJson(res, 405, { ok: false, message: "Método não permitido." });
    return;
  }

  const clients = getSupabaseServerClients();
  const apiKey = getSteamApiKey();

  if (!clients || !apiKey) {
    console.error("[steam-library] Missing server credentials.");
    sendJson(res, 500, { ok: false, message: "Integração com a Steam indisponível." });
    return;
  }

  const user = await authenticateRequest(req, clients);

  if (!user) {
    sendJson(res, 401, { ok: false, message: "Sua sessão expirou. Entre novamente." });
    return;
  }

  try {
    if (req.method === "DELETE") {
      const { error } = await clients.adminClient.from("steam_connections").delete().eq("user_id", user.id);

      if (error) throw error;
      sendJson(res, 200, { ok: true });
      return;
    }

    const connection = await getConnection(user.id, clients.adminClient);

    if (req.method === "GET") {
      const incompleteGames = connection
        ? await getIncompleteGames(user.id, clients.adminClient)
        : [];

      sendJson(res, 200, { ok: true, connection, incompleteGames });
      return;
    }

    if (!connection) {
      sendJson(res, 409, { ok: false, message: "Conecte sua conta Steam antes de importar." });
      return;
    }

    const result = await synchronizeLibrary(user.id, connection.steam_id, clients.adminClient, apiKey);

    sendJson(res, 200, { ok: true, result });
  } catch (error) {
    console.error("[steam-library] Request failed:", error);

    sendJson(res, 500, {
      ok: false,
      message: getRequestErrorMessage(error, req.method),
    });
  }
}

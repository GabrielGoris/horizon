import type { ServerResponse } from "node:http";
import type { ApiRequest } from "../../server/http";
import { readJsonBody, sendJson } from "../../server/http";
import { authenticateRequest, getSupabaseServerClients } from "../../server/supabaseAdmin";
import { getIgdbDetailsBySteamGames } from "../../server/igdb";
import { getHltbCampaignHoursByGames } from "../../server/hltb";
import {
  getSteamLibraryBackdrop,
  getSteamLibraryCover,
  getSteamStoreGameDetails,
  stripSteamHtml,
} from "../../server/steam";
import { getIncompleteSteamGame } from "../../server/steamEnrichment";

export const config = { maxDuration: 60 };

if (!process.env.VERCEL) {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // The local environment may already be loaded.
  }
}

type EnrichmentBody = { appIds?: unknown };

type ImportedGameRow = {
  backdrop: string | null;
  campaign_hours: number | string | null;
  category: string | null;
  cover: string | null;
  creator: string | null;
  description: string | null;
  external_id: string;
  id: string;
  meta: string | null;
  release_year: string | null;
  status: "complete" | "dropped" | "in_progress" | "queue";
  title: string;
  user_id: string;
};

function normalizeAppIds(value: unknown) {
  if (!Array.isArray(value)) return [];

  return [...new Set(value
    .map((appId) => Number(appId))
    .filter((appId) => Number.isInteger(appId) && appId > 0))]
    .slice(0, 8);
}

function getReleaseYear(date?: string) {
  return date?.match(/\d{4}/)?.[0] ?? "";
}

function normalizeCampaignHours(value: number | string | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (!value?.trim()) return null;

  const normalizedValue = value.toLowerCase().replace(",", ".").trim();
  const hourMatch = normalizedValue.match(/(\d+(?:\.\d+)?)\s*h/);
  const minuteMatch = normalizedValue.match(/(\d+(?:\.\d+)?)\s*(?:m|min)/);

  if (hourMatch || minuteMatch) {
    const hours = hourMatch ? Number(hourMatch[1]) : 0;
    const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
    const duration = hours + minutes / 60;

    return Number.isFinite(duration) ? Number(duration.toFixed(2)) : null;
  }

  const duration = Number(normalizedValue);

  return Number.isFinite(duration) ? duration : null;
}

function getEnrichmentErrorMessage(error: unknown) {
  const databaseMessage = error && typeof error === "object" && "message" in error
    ? String(error.message)
    : "";

  if (databaseMessage.includes("enrichment_checked_at")) {
    return "Os jogos foram importados.";
  }

  return "Os jogos foram importados, mas alguns detalhes não puderam ser salvos.";
}

export default async function handler(req: ApiRequest, res: ServerResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendJson(res, 405, { ok: false, message: "Método não permitido." });
    return;
  }

  const clients = getSupabaseServerClients();

  if (!clients) {
    sendJson(res, 500, { ok: false, message: "Integração com a Steam indisponível." });
    return;
  }

  const user = await authenticateRequest(req, clients);

  if (!user) {
    sendJson(res, 401, { ok: false, message: "Sua sessão expirou. Entre novamente." });
    return;
  }

  const body = await readJsonBody<EnrichmentBody>(req);
  const appIds = normalizeAppIds(body?.appIds);

  if (!appIds.length) {
    sendJson(res, 400, { ok: false, message: "Informe os jogos que devem receber detalhes." });
    return;
  }

  try {
    const { data, error } = await clients.adminClient
      .from("media_items")
      .select("id, user_id, title, status, creator, category, cover, backdrop, release_year, campaign_hours, meta, description, external_id")
      .eq("user_id", user.id)
      .eq("type", "games")
      .eq("source", "steam")
      .in("external_id", appIds.map(String));

    if (error) throw error;

    const rows = (data ?? []) as ImportedGameRow[];
    const rowsByAppId = new Map(rows.map((row) => [Number(row.external_id), row]));
    const steamDetails: Array<{
      appId: number;
      details: Awaited<ReturnType<typeof getSteamStoreGameDetails>>;
    }> = [];

    for (let index = 0; index < appIds.length; index += 3) {
      const batch = appIds.slice(index, index + 3);
      const batchDetails = await Promise.all(batch.map(async (appId) => ({
        appId,
        details: await getSteamStoreGameDetails(appId).catch(() => null),
      })));

      steamDetails.push(...batchDetails);
    }

    const enrichmentCandidates = appIds.map((appId) => ({
      appId,
      releaseYear: rowsByAppId.get(appId)?.release_year,
      title: rowsByAppId.get(appId)?.title ?? "",
    }));
    const [igdbDetailsByAppId, hltbCampaignHoursByAppId] = await Promise.all([
      getIgdbDetailsBySteamGames(enrichmentCandidates).catch(() => new Map()),
      getHltbCampaignHoursByGames(enrichmentCandidates).catch(() => new Map()),
    ]);
    const payload = steamDetails.flatMap(({ appId, details: game }) => {
      const existing = rowsByAppId.get(appId);
      const igdbGame = igdbDetailsByAppId.get(appId);

      if (!existing || (!game && !igdbGame)) return [];

      const creator = game?.developers?.slice(0, 2).join(", ")
        || game?.publishers?.slice(0, 2).join(", ")
        || igdbGame?.creator
        || "";
      const category = game?.genres
        ?.map((genre) => genre.description)
        .filter((genre): genre is string => Boolean(genre))
        .slice(0, 3)
        .join(", ") || igdbGame?.category || "";
      const description = stripSteamHtml(
        game?.short_description || game?.about_the_game || game?.detailed_description,
      ) || igdbGame?.description || "";
      const basicCover = getSteamLibraryCover(appId);
      const basicBackdrop = getSteamLibraryBackdrop(appId);
      const cover = existing.cover && existing.cover !== basicCover
        ? existing.cover
        : game ? basicCover : igdbGame?.cover || basicCover;
      const backdrop = existing.backdrop && existing.backdrop !== basicBackdrop
        ? existing.backdrop
        : game?.header_image
          || game?.capsule_image
          || game?.capsule_imagev5
          || igdbGame?.backdrop
          || basicBackdrop;

      return [{
        user_id: user.id,
        title: game?.name || igdbGame?.title || existing.title,
        type: "games",
        status: existing.status,
        creator: existing.creator || creator || null,
        category: existing.category || category || null,
        cover,
        backdrop,
        release_year: existing.release_year || getReleaseYear(game?.release_date?.date) || igdbGame?.releaseYear || null,
        campaign_hours: normalizeCampaignHours(existing.campaign_hours)
          ?? normalizeCampaignHours(hltbCampaignHoursByAppId.get(appId))
          ?? normalizeCampaignHours(igdbGame?.campaignHours),
        meta: existing.meta || "Steam",
        description: existing.description || description || null,
        source: "steam",
        external_id: String(appId),
      }];
    });
    const payloadAppIds = new Set(payload.map((game) => Number(game.external_id)));
    const successfulAttemptAppIds = new Set(appIds.filter((appId) => (
      rowsByAppId.has(appId) && !payloadAppIds.has(appId)
    )));
    const incompleteGamesByAppId = new Map(appIds
      .filter((appId) => !payloadAppIds.has(appId))
      .map((appId) => ({
        appId,
        mediaId: rowsByAppId.get(appId)?.id ?? "",
        title: rowsByAppId.get(appId)?.title || `Steam App ${appId}`,
        reason: rowsByAppId.has(appId)
          ? "Não encontrado na loja da Steam nem no IGDB."
          : "Registro importado não encontrado no Horizon.",
      }))
      .map((game) => [game.appId, game]));

    payload.forEach((game) => {
      const incompleteGame = getIncompleteSteamGame({
        ...game,
        id: rowsByAppId.get(Number(game.external_id))?.id,
      });

      if (incompleteGame) incompleteGamesByAppId.set(incompleteGame.appId, incompleteGame);
    });

    let enriched = payload.filter((game) => !getIncompleteSteamGame(game)).length;

    if (payload.length) {
      const { error: updateError } = await clients.adminClient
        .from("media_items")
        .upsert(payload, { onConflict: "user_id,source,external_id" });

      if (updateError) {
        console.warn("[steam-enrich] Batch update failed, retrying each game:", updateError);
        enriched = 0;
        const individualUpdates = await Promise.all(payload.map(async (game) => {
          const appId = Number(game.external_id);
          const { error: individualError } = await clients.adminClient
            .from("media_items")
            .upsert(game, { onConflict: "user_id,source,external_id" });

          if (individualError) {
            console.error("[steam-enrich] Game update failed:", {
              appId,
              error: individualError,
            });

            incompleteGamesByAppId.set(appId, {
              appId,
              mediaId: rowsByAppId.get(appId)?.id ?? "",
              title: game.title,
              reason: "As informações foram encontradas, mas não puderam ser salvas.",
            });
          } else {
            successfulAttemptAppIds.add(appId);
          }

          return !individualError && !getIncompleteSteamGame(game);
        }));

        enriched = individualUpdates.filter(Boolean).length;
      } else {
        payloadAppIds.forEach((appId) => successfulAttemptAppIds.add(appId));
      }
    }

    if (successfulAttemptAppIds.size) {
      const { error: attemptError } = await clients.adminClient
        .from("media_items")
        .update({ enrichment_checked_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("type", "games")
        .eq("source", "steam")
        .in("external_id", [...successfulAttemptAppIds].map(String));

      if (attemptError) throw attemptError;
    }

    sendJson(res, 200, {
      ok: true,
      enriched,
      failed: incompleteGamesByAppId.size,
      failedGames: [...incompleteGamesByAppId.values()],
    });
  } catch (error) {
    console.error("[steam-enrich] Request failed:", error);
    sendJson(res, 500, { ok: false, message: getEnrichmentErrorMessage(error) });
  }
}

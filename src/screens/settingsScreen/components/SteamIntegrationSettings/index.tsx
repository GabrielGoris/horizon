import { CheckCircle2, ExternalLink, Link2, LoaderCircle, RefreshCw, Unlink } from "lucide-react";
import { useEffect, useState } from "react";
import { MediaDossier } from "../../../../components/MediaDossier";
import { useMediaEditor } from "../../../../hooks/useMediaEditor";
import type { UpdateMediaDetailsDTO } from "../../../../schemas/media";
import {
  disconnectSteam,
  enrichSteamGames,
  getSteamIntegrationState,
  startSteamConnection,
  syncSteamLibrary,
  type SteamConnection,
  type SteamEnrichmentFailure,
  type SteamSyncResult,
} from "../../../../services/steamIntegrationService";
import type { SteamIntegrationSettingsProps } from "./types";
import {
  LIBRARY_UPDATED_EVENT,
  notifySteamGamesAdded,
} from "../../../../utils/libraryEvents";

function formatSyncDate(value: string | null) {
  if (!value) return "Ainda não sincronizada";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function SteamIntegrationSettings({ session }: SteamIntegrationSettingsProps) {
  const mediaEditor = useMediaEditor();
  const [connection, setConnection] = useState<SteamConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [action, setAction] = useState<"connect" | "disconnect" | "sync" | null>(null);
  const [errorMessage, setErrorMessage] = useState(() => {
    const status = new URLSearchParams(window.location.search).get("steam");

    return status === "error" ? "A Steam não confirmou a conexão. Tente novamente." : "";
  });
  const [syncResult, setSyncResult] = useState<SteamSyncResult | null>(null);
  const [enrichmentResult, setEnrichmentResult] = useState({ enriched: 0, failed: 0 });
  const [enrichmentFailures, setEnrichmentFailures] = useState<SteamEnrichmentFailure[]>([]);
  const [enrichmentProgress, setEnrichmentProgress] = useState({ completed: 0, total: 0 });
  const enrichmentPercentage = enrichmentProgress.total > 0
    ? Math.round((enrichmentProgress.completed / enrichmentProgress.total) * 100)
    : 0;
  const isEnrichmentIncomplete = enrichmentProgress.total > 0
    && enrichmentProgress.completed < enrichmentProgress.total;
  const isEnriching = action === "sync"
    && isEnrichmentIncomplete;

  useEffect(() => {
    let isMounted = true;

    getSteamIntegrationState(session)
      .then((state) => {
        if (isMounted) {
          setConnection(state.connection);
          setEnrichmentFailures(state.incompleteGames);
        }
      })
      .catch((error) => {
        if (isMounted) setErrorMessage(error instanceof Error ? error.message : "Não foi possível carregar a conexão Steam.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [session]);

  useEffect(() => {
    const handleLibraryUpdate = () => {
      getSteamIntegrationState(session)
        .then((state) => {
          setConnection(state.connection);
          setEnrichmentFailures(state.incompleteGames);
        })
        .catch((error) => {
          setErrorMessage(error instanceof Error ? error.message : "Não foi possível atualizar o estado da Steam.");
        });
    };

    window.addEventListener(LIBRARY_UPDATED_EVENT, handleLibraryUpdate);

    return () => {
      window.removeEventListener(LIBRARY_UPDATED_EVENT, handleLibraryUpdate);
    };
  }, [session]);

  const handleConnect = async () => {
    setAction("connect");
    setErrorMessage("");

    try {
      window.location.assign(await startSteamConnection(session));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível conectar à Steam.");
      setAction(null);
    }
  };

  const handleSync = async () => {
    setAction("sync");
    setErrorMessage("");
    setSyncResult(null);
    setEnrichmentResult({ enriched: 0, failed: 0 });
    setEnrichmentFailures([]);
    setEnrichmentProgress({ completed: 0, total: 0 });

    try {
      const result = await syncSteamLibrary(session);
      const incompleteGames = result.incompleteGames ?? [];

      notifySteamGamesAdded(result.newGames ?? []);

      setSyncResult(result);
      setEnrichmentFailures(incompleteGames);
      setConnection((current) => current ? { ...current, last_synced_at: result.syncedAt } : current);

      if (result.enrichmentAppIds.length) {
        let enriched = 0;
        let failed = 0;
        const incompleteGamesByAppId = new Map(incompleteGames.map((game) => [game.appId, game]));

        setEnrichmentProgress({ completed: 0, total: result.enrichmentAppIds.length });

        try {
          for (let index = 0; index < result.enrichmentAppIds.length; index += 8) {
            const batch = result.enrichmentAppIds.slice(index, index + 8);
            const batchResult = await enrichSteamGames(session, batch);

            enriched += batchResult.enriched;
            failed += batchResult.failed;
            batch.forEach((appId) => incompleteGamesByAppId.delete(appId));
            batchResult.failedGames.forEach((game) => incompleteGamesByAppId.set(game.appId, game));
            setEnrichmentResult({ enriched, failed });
            setEnrichmentFailures([...incompleteGamesByAppId.values()]);
            setEnrichmentProgress({
              completed: Math.min(index + batch.length, result.enrichmentAppIds.length),
              total: result.enrichmentAppIds.length,
            });
          }
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? `Os jogos foram importados, mas o detalhamento parou: ${error.message}`
              : "Os jogos foram importados, mas o detalhamento não foi concluído.",
          );
        }
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível importar sua biblioteca.");
    } finally {
      setAction(null);
    }
  };

  const handleDisconnect = async () => {
    setAction("disconnect");
    setErrorMessage("");

    try {
      await disconnectSteam(session);
      setConnection(null);
      setSyncResult(null);
      setEnrichmentFailures([]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível desconectar a Steam.");
    } finally {
      setAction(null);
    }
  };

  const handleOpenPendingGame = async (game: SteamEnrichmentFailure) => {
    try {
      const selectedGame = await mediaEditor.openMedia(game.mediaId
        ? { id: game.mediaId }
        : { externalId: String(game.appId), source: "steam" });

      if (!selectedGame) setErrorMessage("Não foi possível encontrar este jogo na biblioteca.");
    } catch {
      setErrorMessage("Não foi possível abrir a ficha deste jogo.");
    }
  };

  const handleDetailsChange = async (item: Parameters<typeof mediaEditor.handleUpdateMediaDetails>[0], details: UpdateMediaDetailsDTO) => {
    await mediaEditor.handleUpdateMediaDetails(item, details);
    const state = await getSteamIntegrationState(session);

    setConnection(state.connection);
    setEnrichmentFailures(state.incompleteGames);
  };

  if (isLoading) {
    return (
      <section className="flex min-h-48 items-center justify-center rounded-xl border border-white/10 bg-[#1a1a1e] text-neutral-400">
        <LoaderCircle className="animate-spin" size={22} />
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1e]">
        <div className="flex flex-col gap-6 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            {connection?.avatar_url ? (
              <img src={connection.avatar_url} alt="" className="h-14 w-14 shrink-0 rounded-full border border-white/10 object-cover" />
            ) : (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#66c0f4]/25 bg-[#1b2838] text-[#66c0f4]">
                <Link2 size={23} />
              </span>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Steam</h2>
                {connection && <CheckCircle2 size={15} className="text-emerald-400" />}
              </div>
              {connection ? (
                <>
                  <p className="mt-1 truncate text-sm font-semibold text-neutral-300">{connection.display_name || connection.steam_id}</p>
                  <p className="mt-1 text-xs text-neutral-500">Última sincronização: {formatSyncDate(connection.last_synced_at)}</p>
                </>
              ) : (
                <p className="mt-1 max-w-xl text-sm leading-6 text-neutral-400">
                  Conecte sua conta para importar os jogos próprios e o tempo registrado pela Steam.
                </p>
              )}
            </div>
          </div>

          {connection ? (
            <div className="flex shrink-0 flex-wrap gap-2">
              {connection.profile_url && (
                <a
                  href={connection.profile_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-400 hover:bg-white/[0.04] hover:text-white"
                >
                  <ExternalLink size={14} /> Perfil
                </a>
              )}
              <button
                type="button"
                onClick={() => void handleSync()}
                disabled={Boolean(action)}
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#66c0f4] px-4 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#101820] hover:bg-white disabled:opacity-50"
              >
                {action === "sync" ? <LoaderCircle className="animate-spin" size={15} /> : <RefreshCw size={15} />}
                {action === "sync"
                  ? enrichmentProgress.total > 0
                    ? `Detalhando ${enrichmentProgress.completed}/${enrichmentProgress.total}`
                    : "Importando"
                  : "Importar jogos"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void handleConnect()}
              disabled={Boolean(action)}
              className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#66c0f4] px-5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#101820] hover:bg-white disabled:opacity-50"
            >
              {action === "connect" ? <LoaderCircle className="animate-spin" size={15} /> : <Link2 size={15} />}
              Conectar Steam
            </button>
          )}
        </div>

        {connection && (
          <div className="flex flex-col gap-4 border-t border-white/5 bg-black/10 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <p className="max-w-2xl text-xs leading-5 text-neutral-500">
              Todos os jogos novos entram na fila. Seus estados alterados manualmente são preservados nas próximas sincronizações.
            </p>
            <button
              type="button"
              onClick={() => void handleDisconnect()}
              disabled={Boolean(action)}
              className="flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-red-400/20 px-3 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-red-200 hover:bg-red-500/10 disabled:opacity-50"
            >
              {action === "disconnect" ? <LoaderCircle className="animate-spin" size={14} /> : <Unlink size={14} />}
              Desconectar
            </button>
          </div>
        )}
      </section>

      {syncResult && (
        <p role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
          Biblioteca sincronizada: {syncResult.total} jogos encontrados, {syncResult.added} adicionados, {syncResult.updated} atualizados
          {syncResult.linked > 0 ? ` e ${syncResult.linked} vinculados a registros existentes` : ""}.
        </p>
      )}

      {enrichmentProgress.total > 0 && (
        <section
          role="status"
          className="overflow-hidden rounded-xl border border-emerald-400/20 bg-emerald-500/10"
        >
          <div className="flex items-start gap-3 px-5 py-4">
            {isEnriching ? (
              <LoaderCircle className="mt-0.5 shrink-0 animate-spin text-emerald-300" size={17} />
            ) : isEnrichmentIncomplete ? (
              <RefreshCw className="mt-0.5 shrink-0 text-emerald-300" size={17} />
            ) : (
              <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" size={17} />
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold text-emerald-100">
                {isEnriching
                  ? "Detalhando jogos"
                  : isEnrichmentIncomplete
                    ? "Detalhamento interrompido"
                    : "Detalhamento concluído"}
              </p>
              <p className="mt-1 text-xs leading-5 text-emerald-100/70">
                {enrichmentProgress.completed} de {enrichmentProgress.total} jogos analisados. {" "}
                {enrichmentResult.enriched} receberam informações completas
                {enrichmentResult.failed > 0
                  ? ` e ${enrichmentResult.failed} não tiveram detalhes encontrados`
                  : ""}.
              </p>
            </div>
            <span className="ml-auto shrink-0 font-mono text-[10px] font-bold tracking-[0.08em] text-emerald-300">
              {enrichmentPercentage}%
            </span>
          </div>
          <div className="h-1 bg-emerald-950/50">
            <div
              className="h-full bg-emerald-400 transition-[width] duration-300 ease-out"
              style={{ width: `${enrichmentPercentage}%` }}
            />
          </div>
        </section>
      )}

      {enrichmentFailures.length > 0 && !isEnriching && (
        <section className="overflow-hidden rounded-xl border border-amber-300/15 bg-amber-500/[0.06]">
          <div className="border-b border-amber-300/10 px-5 py-4">
            <h3 className="text-sm font-bold text-amber-100">
              Informações pendentes ({enrichmentFailures.length})
            </h3>
            <p className="mt-1 text-xs leading-5 text-amber-100/55">
              Estes jogos continuam normalmente na biblioteca. A ausência de tempo de campanha não fará com que sejam analisados novamente; você poderá completar esses campos manualmente depois.
            </p>
          </div>
          <ul className="max-h-64 divide-y divide-white/5 overflow-y-auto">
            {enrichmentFailures.map((game) => (
              <li key={game.appId} className="flex items-center gap-4 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => void handleOpenPendingGame(game)}
                    className="block max-w-full truncate text-left text-sm font-semibold text-neutral-200 transition-colors hover:text-noir-champagne"
                  >
                    {game.title}
                  </button>
                  <p className="mt-0.5 text-xs text-neutral-500">{game.reason}</p>
                </div>
                <a
                  href={`https://store.steampowered.com/app/${game.appId}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Abrir ${game.title} na Steam`}
                  className="shrink-0 text-neutral-500 transition-colors hover:text-amber-200"
                >
                  <ExternalLink size={15} />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {errorMessage && (
        <p role="alert" className="rounded-xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-100">
          {errorMessage}
        </p>
      )}

      <section className="rounded-xl border border-white/10 bg-[#1a1a1e] px-6 py-5">
        <h2 className="text-sm font-bold text-white">Privacidade da biblioteca</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-400">
          Para a importação funcionar, abra seu perfil Steam e deixe “Detalhes de jogos” como público. A senha da Steam nunca passa pelo Horizon.
        </p>
      </section>

      {mediaEditor.selectedMedia && (
        <MediaDossier
          item={mediaEditor.selectedMedia}
          onClose={mediaEditor.closeMedia}
          onComplete={mediaEditor.handleCompleteMedia}
          onDelete={() => undefined}
          onDetailsChange={handleDetailsChange}
          onMetaChange={mediaEditor.handleUpdateMediaMeta}
          onStatusChange={mediaEditor.handleUpdateMediaStatus}
          onSaveAudiovisualCompletion={mediaEditor.handleSaveAudiovisualCompletion}
          onSaveBookCompletion={mediaEditor.handleSaveBookCompletion}
          onSaveGameCompletion={mediaEditor.handleSaveGameCompletion}
          showDeleteAction={false}
        />
      )}
    </div>
  );
}

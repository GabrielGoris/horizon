import type { Session } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchMediaItem, deleteMedia } from "../../services/mediaService";
import { DeleteMediaDialog } from "../DeleteMediaDialog";
import type { MediaItem } from "../../types";
import { useConfirmUnsavedChanges } from "../../hooks/useUnsavedChanges";
import {
  enrichSteamGames,
  getSteamIntegrationState,
  syncSteamLibrary,
  type SteamDiscoveredGame,
} from "../../services/steamIntegrationService";
import { isSteamAutoSyncDue, STEAM_AUTO_SYNC_CHECK_INTERVAL_MS } from "../../utils/steamAutoSync";
import { sendSteamSyncNotification } from "../../services/pushNotificationService";
import {
  notifyLibraryUpdated,
  notifySteamGamesAdded,
  STEAM_GAMES_ADDED_EVENT,
} from "../../utils/libraryEvents";
import { SteamGamesAddedDialog } from "../SteamGamesAddedDialog";
import { mergeSteamGames, readSteamNews, reconcileSteamNews, saveSteamNews, type SteamNews } from "../../utils/steamNews";

type SteamAutoSyncProps = {
  session: Session;
};

export function SteamAutoSync({ session }: SteamAutoSyncProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const requestDiscard = useConfirmUnsavedChanges();
  const [itemToDelete, setItemToDelete] = useState<MediaItem | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [actionError, setActionError] = useState("");
  const actOnGame = (game: SteamDiscoveredGame, action: "open" | "delete") => {
    if (isActing) return;
    requestDiscard(() => {
      void (async () => {
        setIsActing(true); setActionError("");
        try {
          const item = await fetchMediaItem({ source: "steam", externalId: String(game.appId) });
          if (!item) throw new Error("Este jogo não está mais na biblioteca.");
          if (action === "delete") setItemToDelete(item);
          else navigate(`/dossier/${item.id}`, { state: { returnTo: "/games" } });
        } catch (error) { setActionError(error instanceof Error ? error.message : "Não foi possível abrir o item."); }
        finally { setIsActing(false); }
      })();
    });
  };
  const isActive = useRef(false);
  const isSynchronizing = useRef(false);
  const [news, setNews] = useState<SteamNews | null>(() => readSteamNews(session.user.id));
  const hasBaseline = useRef(news !== null);
  const addedGames = news?.pending ?? [];
  const [isDetailing, setIsDetailing] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailProgress, setDetailProgress] = useState({ completed: 0, total: 0 });

  useEffect(() => {
    if (news) saveSteamNews(session.user.id, news);
  }, [news, session.user.id]);

  useEffect(() => {
    const handleGamesAdded = (event: Event) => {
      const games = (event as CustomEvent<SteamDiscoveredGame[]>).detail;

      if (!games?.length) return;

      setNews((previous) => ({
        knownAppIds: [...new Set([...(previous?.knownAppIds ?? []), ...games.map((game) => game.appId)])],
        pending: mergeSteamGames(previous?.pending ?? [], games),
      }));
    };

    window.addEventListener(STEAM_GAMES_ADDED_EVENT, handleGamesAdded);

    return () => {
      window.removeEventListener(STEAM_GAMES_ADDED_EVENT, handleGamesAdded);
    };
  }, []);

  useEffect(() => {
    isActive.current = true;

    const loadNewsSnapshot = async () => {
      try {
        const state = await getSteamIntegrationState(session, true);
        if (!isActive.current || !state.connection || !state.libraryGames) return;
        const baselineReady = hasBaseline.current;
        hasBaseline.current = true;
        setNews((previous) => {
          if (baselineReady) return reconcileSteamNews(previous, state.libraryGames!);
          const baseline = reconcileSteamNews(null, state.libraryGames!);
          return {
            knownAppIds: [...new Set([...baseline.knownAppIds, ...(previous?.knownAppIds ?? [])])],
            pending: previous?.pending ?? [],
          };
        });
      } catch (error) {
        console.warn("[steam-auto-sync] Não foi possível conferir as novidades anteriores:", error);
      }
    };

    const synchronize = async () => {
      if (isSynchronizing.current) return;
      isSynchronizing.current = true;

      try {
        const state = await getSteamIntegrationState(session);
        if (!isActive.current) return;
        if (!state.connection || !isSteamAutoSyncDue(state.connection.last_synced_at)) return;

        const result = await syncSteamLibrary(session);

        if (!isActive.current) return;

        const newGames = result.newGames ?? [];

        if (newGames.length > 0) {
          notifySteamGamesAdded(newGames);
          notifyLibraryUpdated();
          void sendSteamSyncNotification(session, "discovered", newGames.length)
            .catch((error) => console.warn("[steam-auto-sync] Não foi possível avisar sobre jogos novos:", error));
        }

        if (!result.enrichmentAppIds.length) return;

        setIsDetailing(true);
        setDetailError("");
        setDetailProgress({ completed: 0, total: result.enrichmentAppIds.length });

        try {
          for (let index = 0; index < result.enrichmentAppIds.length; index += 8) {
            const batch = result.enrichmentAppIds.slice(index, index + 8);

            await enrichSteamGames(session, batch);
            if (!isActive.current) return;

            setDetailProgress({
              completed: Math.min(index + batch.length, result.enrichmentAppIds.length),
              total: result.enrichmentAppIds.length,
            });
          }

          notifyLibraryUpdated();
        } catch (error) {
          if (isActive.current && newGames.length > 0) {
            setDetailError(error instanceof Error
              ? `Os jogos foram adicionados, mas o detalhamento parou: ${error.message}`
              : "Os jogos foram adicionados, mas o detalhamento não foi concluído.");
          }
        } finally {
          if (isActive.current) setIsDetailing(false);
        }
      } catch (error) {
        console.error("[steam-auto-sync] Não foi possível sincronizar a biblioteca:", error);
        if (isActive.current) {
          void sendSteamSyncNotification(session, "failed")
            .catch((notificationError) => console.warn("[steam-auto-sync] Não foi possível avisar sobre a falha:", notificationError));
        }
      } finally {
        isSynchronizing.current = false;
      }
    };

    void loadNewsSnapshot();

    const syncTimer = window.setTimeout(() => {
      void synchronize();
    }, 10_000);
    const syncInterval = window.setInterval(() => {
      void synchronize();
    }, STEAM_AUTO_SYNC_CHECK_INTERVAL_MS);

    return () => {
      window.clearTimeout(syncTimer);
      window.clearInterval(syncInterval);
      isActive.current = false;
    };
  }, [session]);

  if (location.pathname !== "/games" || !addedGames.length) return null;

  return (
    <>
    {itemToDelete ? <DeleteMediaDialog item={itemToDelete} isDeleting={isActing} onCancel={() => !isActing && setItemToDelete(null)} onConfirm={async () => {
      if (isActing) return;
      setIsActing(true); setActionError("");
      try {
        await deleteMedia(itemToDelete);
        setNews((previous) => previous ? { ...previous, pending: previous.pending.filter((game) => String(game.appId) !== itemToDelete.external_id) } : previous);
        notifyLibraryUpdated();
        setItemToDelete(null);
      } catch { setActionError("Não foi possível excluir o jogo. Tente novamente."); setItemToDelete(null); }
      finally { setIsActing(false); }
    }} /> :
    <SteamGamesAddedDialog
      onOpenItem={(game) => void actOnGame(game, "open")}
      onDeleteItem={(game) => void actOnGame(game, "delete")}
      isActing={isActing}
      actionError={actionError}
      detailError={detailError}
      detailProgress={detailProgress}
      games={addedGames}
      isDetailing={isDetailing}
      onClose={() => {
        if (isActing) return;
        setNews((previous) => previous ? { ...previous, pending: [] } : previous);
      }}
    />}
    </>
  );
}

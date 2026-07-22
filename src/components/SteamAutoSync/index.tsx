import type { Session } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  enrichSteamGames,
  getSteamIntegrationState,
  syncSteamLibrary,
  type SteamDiscoveredGame,
} from "../../services/steamIntegrationService";
import { isSteamAutoSyncDue } from "../../utils/steamAutoSync";
import {
  notifyLibraryUpdated,
  notifySteamGamesAdded,
  STEAM_GAMES_ADDED_EVENT,
} from "../../utils/libraryEvents";
import { SteamGamesAddedDialog } from "../SteamGamesAddedDialog";

type SteamAutoSyncProps = {
  session: Session;
};

export function SteamAutoSync({ session }: SteamAutoSyncProps) {
  const location = useLocation();
  const isActive = useRef(false);
  const hasStarted = useRef(false);
  const [addedGames, setAddedGames] = useState<SteamDiscoveredGame[]>([]);
  const [isDetailing, setIsDetailing] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailProgress, setDetailProgress] = useState({ completed: 0, total: 0 });

  useEffect(() => {
    const handleGamesAdded = (event: Event) => {
      const games = (event as CustomEvent<SteamDiscoveredGame[]>).detail;

      if (!games?.length) return;

      setAddedGames(games);
    };

    window.addEventListener(STEAM_GAMES_ADDED_EVENT, handleGamesAdded);

    return () => {
      window.removeEventListener(STEAM_GAMES_ADDED_EVENT, handleGamesAdded);
    };
  }, []);

  useEffect(() => {
    isActive.current = true;

    if (hasStarted.current) {
      return () => {
        isActive.current = false;
      };
    }

    hasStarted.current = true;

    const synchronize = async () => {
      try {
        const state = await getSteamIntegrationState(session);

        if (!state.connection || !isSteamAutoSyncDue(state.connection.last_synced_at)) return;

        const result = await syncSteamLibrary(session);

        if (!isActive.current) return;

        const newGames = result.newGames ?? [];

        if (newGames.length > 0) {
          notifySteamGamesAdded(newGames);
          notifyLibraryUpdated();
        }

        if (!result.enrichmentAppIds.length) return;

        setIsDetailing(true);
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
      }
    };

    const syncTimer = window.setTimeout(() => {
      void synchronize();
    }, 10_000);

    return () => {
      window.clearTimeout(syncTimer);
      isActive.current = false;
    };
  }, [session]);

  if (location.pathname !== "/games" || !addedGames.length) return null;

  return (
    <SteamGamesAddedDialog
      detailError={detailError}
      detailProgress={detailProgress}
      games={addedGames}
      isDetailing={isDetailing}
      onClose={() => {
        setAddedGames([]);
        setIsDetailing(false);
      }}
    />
  );
}

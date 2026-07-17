import { CheckCircle2, Gamepad2, LoaderCircle, X } from "lucide-react";
import type { SteamDiscoveredGame } from "../../services/steamIntegrationService";

type SteamGamesAddedDialogProps = {
  detailError?: string;
  detailProgress: { completed: number; total: number };
  games: SteamDiscoveredGame[];
  isDetailing: boolean;
  onClose: () => void;
};

function formatPlaytime(hours: number) {
  if (hours <= 0) return "Ainda não jogado";

  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (!wholeHours) return `${minutes} min jogados`;
  if (!minutes) return `${wholeHours}h jogadas`;

  return `${wholeHours}h ${minutes}min jogados`;
}

export function SteamGamesAddedDialog({
  detailError,
  detailProgress,
  games,
  isDetailing,
  onClose,
}: SteamGamesAddedDialogProps) {
  const gameLabel = games.length === 1 ? "jogo foi adicionado" : "jogos foram adicionados";
  const percentage = detailProgress.total > 0
    ? Math.round((detailProgress.completed / detailProgress.total) * 100)
    : 100;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-5 backdrop-blur-[6px]">
      <button type="button" aria-label="Fechar aviso" className="absolute inset-0 cursor-default" onClick={onClose} />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="steam-games-added-title"
        className="relative z-10 flex max-h-[82vh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#19191c] shadow-[0_30px_100px_rgba(0,0,0,0.78)]"
      >
        <header className="flex items-start justify-between border-b border-white/10 px-6 py-5">
          <div className="flex min-w-0 gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#66c0f4]/25 bg-[#66c0f4]/10 text-[#66c0f4]">
              <Gamepad2 size={21} />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-[#66c0f4]">
                Biblioteca Steam
              </p>
              <h2 id="steam-games-added-title" className="mt-1 font-serif text-2xl font-extrabold text-white">
                Novidades no Horizon
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-400">
                {games.length} {gameLabel} à sua fila.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-neutral-400 transition-colors hover:border-white/20 hover:text-white"
          >
            <X size={18} />
          </button>
        </header>

        <ul className="min-h-0 flex-1 divide-y divide-white/5 overflow-y-auto px-2 py-2">
          {games.map((game) => (
            <li key={game.appId} className="flex items-center gap-4 rounded-xl px-4 py-3 transition-colors hover:bg-white/[0.025]">
              <img
                src={game.cover}
                alt=""
                className="h-16 w-11 shrink-0 rounded-md border border-white/10 bg-black/20 object-cover shadow-lg"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-neutral-100">{game.title}</p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-neutral-500">
                  {formatPlaytime(game.playtimeHours)}
                </p>
              </div>
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            </li>
          ))}
        </ul>

        {(isDetailing || detailError) && (
          <div className="border-t border-white/5 bg-black/10 px-6 py-4">
            {isDetailing ? (
              <>
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <LoaderCircle size={14} className="animate-spin text-[#66c0f4]" />
                  <span>Completando as fichas em segundo plano</span>
                  <span className="ml-auto font-mono text-[9px] text-neutral-500">
                    {detailProgress.completed}/{detailProgress.total}
                  </span>
                </div>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full bg-[#66c0f4] transition-[width] duration-300" style={{ width: `${percentage}%` }} />
                </div>
              </>
            ) : (
              <p className="text-xs leading-5 text-amber-200/75">{detailError}</p>
            )}
          </div>
        )}

        <footer className="border-t border-white/10 p-5">
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-full items-center justify-center rounded-lg bg-[#66c0f4] px-4 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#101820] transition-colors hover:bg-white"
          >
            Explorar jogos
          </button>
        </footer>
      </section>
    </div>
  );
}

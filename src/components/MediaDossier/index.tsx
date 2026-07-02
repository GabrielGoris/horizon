import { Check, Trash2, X } from "lucide-react";
import { CompletionArtifacts } from "./CompletionArtifacts";
import { MediaObjectPreview } from "./MediaObjectPreview";
import { statusLabels, typeLabels } from "./consts";
import type { MediaDossierProps } from "./types";
import { formatAuthorLine } from "./utils";

export function MediaDossier({
  item,
  onClose,
  onComplete,
  onDelete,
  onSaveTicket,
  onSaveBookCompletion,
  onSaveGameCompletion,
}: MediaDossierProps) {
  const category = item.category || item.meta || typeLabels[item.type];
  const status = statusLabels[item.status];
  const isComplete = item.status === "complete";
  const progressPercentage = item.progress
    ? Math.min(100, Math.round((item.progress.current / item.progress.total) * 100))
    : 0;

  return (
    <div className="animate-dossier-overlay-in fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-[6px]">
      <button
        type="button"
        aria-label="Fechar dossie"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <aside className="animate-dossier-panel-in relative z-10 flex h-full w-full max-w-[430px] flex-col border-l border-white/10 bg-[#17171a] shadow-[-28px_0_80px_rgba(0,0,0,0.65)]">
        <header className="flex h-[70px] items-center justify-between border-b border-white/10 px-7">
          <div className="flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-noir-gold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Dossie</span>
            <span className="text-neutral-600">-</span>
            <span>{typeLabels[item.type]}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-neutral-400 transition-colors hover:border-white/20 hover:text-white"
          >
            <X size={18} />
          </button>
        </header>

        <div className="animate-dossier-content-in flex-1 overflow-y-auto px-7 py-7">
          <MediaObjectPreview item={item} />

          <div className="text-center">
            <h2 className="font-serif text-3xl font-extrabold leading-[1.05] text-white">
              {item.title}
            </h2>
            <p className="mt-3 font-serif text-sm font-bold italic text-noir-gold">
              {formatAuthorLine(item)}
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[10px] text-neutral-400">
                {category}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[10px] text-neutral-400">
                {status}
              </span>
              {item.rating && (
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[10px] text-neutral-400">
                  {item.rating}
                </span>
              )}
            </div>
          </div>

          <div className="my-8 h-px bg-white/10" />

          <section>
            <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-neutral-600">
              Resumo / Arquivo
            </p>
            <p className="text-sm leading-7 text-neutral-200">
              {item.description || "Nenhuma sinopse cadastrada para esta obra."}
            </p>
          </section>

          {item.progress && (
            <section className="mt-8 rounded-xl border border-white/10 bg-white/[0.025] p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                  Acompanhamento
                </span>
                <span className="font-mono text-xs font-bold text-noir-champagne">
                  {item.progress.current} / {item.progress.total}
                  <span className="ml-1 text-[10px] font-normal uppercase text-neutral-500">
                    {item.progress.unit}
                  </span>
                </span>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-black/70">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#d4af37] to-[#ebdcb9]"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </section>
          )}

          <CompletionArtifacts
            item={item}
            onSaveTicket={onSaveTicket}
            onSaveBookCompletion={onSaveBookCompletion}
            onSaveGameCompletion={onSaveGameCompletion}
          />
        </div>

        <footer className="flex items-center gap-3 border-t border-white/10 p-5">
          <button
            type="button"
            onClick={() => onComplete(item)}
            disabled={isComplete}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[#d4af37] px-4 font-mono text-xs font-bold uppercase tracking-wide text-black transition-colors hover:bg-[#ebdcb9] disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-neutral-500"
          >
            <Check size={16} />
            {isComplete ? "Obra Finalizada" : "Concluir Obra"}
          </button>

          <button
            type="button"
            onClick={() => onDelete(item)}
            aria-label="Excluir obra"
            className="flex h-11 w-12 items-center justify-center rounded-lg border border-red-500/25 bg-red-500/10 text-red-400 transition-colors hover:border-red-400/40 hover:bg-red-500/15 hover:text-red-300"
          >
            <Trash2 size={17} />
          </button>
        </footer>
      </aside>
    </div>
  );
}

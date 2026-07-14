import { CircleAlert, CopyPlus, X } from "lucide-react";
import type { DuplicateMediaDialogProps } from "./types";

export function DuplicateMediaDialog({
  cover,
  isConfirming = false,
  onCancel,
  onConfirm,
  title,
}: DuplicateMediaDialogProps) {
  const coverUrl = cover?.trim();

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 px-5 backdrop-blur-[6px]"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        aria-label="Cancelar adição duplicada"
        className="absolute inset-0 cursor-default"
        onClick={onCancel}
      />

      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="duplicate-media-title"
        aria-describedby="duplicate-media-description"
        className="relative z-10 w-full max-w-[450px] overflow-hidden rounded-2xl border border-white/10 bg-[#1a1a1e] shadow-[0_28px_90px_rgba(0,0,0,0.72)]"
      >
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-noir-gold/25 bg-noir-gold/10 text-noir-gold">
              <CircleAlert size={18} />
            </span>
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-noir-gold">
                Item duplicado
              </p>
              <h2 id="duplicate-media-title" className="mt-1 font-serif text-xl font-extrabold text-white">
                Adicionar novamente?
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            aria-label="Fechar"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-neutral-400 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X size={18} />
          </button>
        </header>

        <div className="px-6 py-6">
          <div className="flex gap-4">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={title}
                className="h-28 w-20 shrink-0 rounded-lg border border-white/10 object-cover shadow-lg"
              />
            ) : (
              <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-2 text-center font-mono text-[9px] uppercase tracking-widest text-neutral-600 shadow-lg">
                Sem capa
              </div>
            )}

            <p id="duplicate-media-description" className="self-center text-sm leading-6 text-neutral-300">
              <strong className="font-semibold text-white">{title}</strong> já está na sua biblioteca. Deseja adicioná-lo novamente?
            </p>
          </div>
        </div>

        <footer className="flex gap-3 border-t border-white/10 bg-black/10 p-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="flex h-11 flex-1 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-4 font-mono text-xs font-bold uppercase tracking-wide text-neutral-300 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-noir-gold/35 bg-noir-gold/15 px-4 font-mono text-xs font-bold uppercase tracking-wide text-noir-champagne transition-colors hover:border-noir-gold/55 hover:bg-noir-gold/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CopyPlus size={16} />
            {isConfirming ? "Adicionando" : "Adicionar novamente"}
          </button>
        </footer>
      </section>
    </div>
  );
}

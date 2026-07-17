import { AlertTriangle, Trash2, X } from "lucide-react";
import type { MediaItem } from "../../types";

type DeleteMediaDialogProps = {
  item: MediaItem;
  isDeleting?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

export function DeleteMediaDialog({
  item,
  isDeleting = false,
  onCancel,
  onConfirm,
}: DeleteMediaDialogProps) {
  const coverUrl = item.cover?.trim();
  const isSteamImport = item.source === "steam" && Boolean(item.external_id);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-5 backdrop-blur-[5px]">
      <button
        type="button"
        aria-label="Cancelar exclusão"
        className="absolute inset-0 cursor-default"
        onClick={onCancel}
      />

      <section className="relative z-10 w-full max-w-[430px] overflow-hidden rounded-2xl border border-white/10 bg-[#1a1a1e] shadow-[0_28px_90px_rgba(0,0,0,0.72)]">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-red-400/20 bg-red-500/10 text-red-300">
              <AlertTriangle size={18} />
            </span>
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-red-300">
                Excluir item
              </p>
              <h2 className="mt-1 font-serif text-xl font-extrabold text-white">
                Remover da biblioteca?
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Fechar"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-neutral-400 transition-colors hover:border-white/20 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="flex gap-4">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={item.title}
                className="h-28 w-20 shrink-0 rounded-lg border border-white/10 object-cover shadow-lg"
              />
            ) : (
              <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-2 text-center font-mono text-[9px] uppercase tracking-widest text-neutral-600 shadow-lg">
                Sem capa
              </div>
            )}

            <div className="min-w-0 pt-1">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                {isSteamImport ? "Não será importado novamente" : "Esta ação não pode ser desfeita"}
              </p>
              <p className="mt-3 text-sm leading-6 text-neutral-300">
                Você está prestes a remover{" "}
                <strong className="font-semibold text-white">"{item.title}"</strong>{" "}
                da sua biblioteca.
                {isSteamImport && " Ele continuará na Steam, mas será ignorado nas próximas sincronizações."}
              </p>
            </div>
          </div>
        </div>

        <footer className="flex gap-3 border-t border-white/10 bg-black/10 p-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="flex h-11 flex-1 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-4 font-mono text-xs font-bold uppercase tracking-wide text-neutral-300 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-red-400/30 bg-red-500/15 px-4 font-mono text-xs font-bold uppercase tracking-wide text-red-200 transition-colors hover:border-red-300/45 hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 size={16} />
            {isDeleting ? "Excluindo" : "Excluir"}
          </button>
        </footer>
      </section>
    </div>
  );
}

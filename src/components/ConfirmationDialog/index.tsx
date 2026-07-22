import { LoaderCircle, Trash2, X } from "lucide-react";
import type { ReactNode } from "react";

interface ConfirmationDialogProps {
  confirmLabel?: string;
  confirmIcon?: ReactNode;
  description: string;
  eyebrow?: string;
  isLoading?: boolean;
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
}

export function ConfirmationDialog({
  confirmLabel = "Excluir",
  confirmIcon,
  description,
  eyebrow = "Ação permanente",
  isLoading = false,
  isOpen,
  onCancel,
  onConfirm,
  title,
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <button type="button" aria-label="Cancelar exclusão" className="absolute inset-0 cursor-default" onMouseDown={onCancel} />
      <section role="alertdialog" aria-modal="true" aria-labelledby="confirmation-title" aria-describedby="confirmation-description" className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#19191c] shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
        <header className="flex items-start justify-between border-b border-white/10 px-6 py-5">
          <div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-red-300/75">{eyebrow}</p>
            <h2 id="confirmation-title" className="mt-2 font-serif text-2xl font-bold italic text-noir-champagne">{title}</h2>
          </div>
          <button type="button" onClick={onCancel} disabled={isLoading} aria-label="Fechar" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-neutral-500 transition hover:text-white disabled:opacity-50">
            <X size={16} />
          </button>
        </header>

        <p id="confirmation-description" className="px-6 py-6 text-sm leading-6 text-neutral-400">{description}</p>

        <footer className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
          <button type="button" onClick={onCancel} disabled={isLoading} className="h-10 rounded-lg border border-white/10 px-4 text-xs font-bold text-neutral-400 transition hover:text-white disabled:opacity-50">
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} disabled={isLoading} className="flex h-10 items-center gap-2 rounded-lg border border-red-400/25 bg-red-500/10 px-4 font-mono text-[10px] font-bold uppercase tracking-wider text-red-300 transition hover:bg-red-500/20 disabled:opacity-50">
            {isLoading ? <LoaderCircle size={14} className="animate-spin" /> : confirmIcon ?? <Trash2 size={14} />}
            {confirmLabel}
          </button>
        </footer>
      </section>
    </div>
  );
}

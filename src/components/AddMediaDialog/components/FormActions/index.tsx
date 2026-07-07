import type { FormActionsProps } from "../types";

export function FormActions({ isSubmitting, onCancel, onSubmitWithPriority }: FormActionsProps) {
  return (
    <div className="shrink-0 border-t border-white/5 bg-[#1a1a1e] px-8 py-6">
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-neutral-400 transition-colors hover:text-white"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-[#d4af37] px-8 py-3 text-xs font-bold uppercase tracking-wider text-black shadow-lg shadow-[#d4af37]/20 transition-all hover:-translate-y-0.5 hover:bg-[#ebdcb9] disabled:opacity-50 disabled:hover:transform-none"
        >
          {isSubmitting ? "Guardando..." : "Guardar Obra"}
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onSubmitWithPriority}
          className="rounded-lg border border-[#d4af37]/35 bg-[#d4af37]/10 px-8 py-3 text-xs font-bold uppercase tracking-wider text-[#ebdcb9] transition-all hover:-translate-y-0.5 hover:border-[#d4af37]/60 hover:bg-[#d4af37]/15 disabled:opacity-50 disabled:hover:transform-none"
        >
          Adicionar a lista de prioridade
        </button>
      </div>
    </div>
  );
}

import { Star, X } from "lucide-react";
import type { MovieTicketEditorProps } from "../types";

export function MovieTicketEditor({
  item,
  watchedAt,
  rating,
  stars,
  onWatchedAtChange,
  onRatingChange,
  onClose,
  onSave,
}: MovieTicketEditorProps) {
  return (
    <div className="absolute inset-0 z-20 flex items-end bg-black/60 p-5 backdrop-blur-sm">
      <div className="w-full rounded-xl border border-white/10 bg-[#202024] p-5 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-noir-gold">
              Ticket de cinema
            </p>
            <h3 className="mt-1 font-serif text-xl font-extrabold text-white">{item.title}</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar editor"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-neutral-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <label className="mb-5 flex flex-col gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
          Data assistida
          <input
            type="date"
            value={watchedAt}
            onChange={(event) => onWatchedAtChange(event.target.value)}
            className="rounded-lg border border-white/10 bg-[#151518] px-3 py-3 text-sm font-medium normal-case tracking-normal text-white outline-none focus:border-noir-gold"
          />
        </label>

        <div>
          <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
            Nota em estrelas
          </p>
          <div className="flex items-center gap-2">
            {stars.map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => onRatingChange(star)}
                aria-label={`Dar nota ${star}`}
                className="text-noir-gold transition-transform hover:scale-110"
              >
                <Star
                  size={26}
                  className={star <= rating ? "fill-current" : "text-neutral-600"}
                />
              </button>
            ))}
            <button
              type="button"
              onClick={() => onRatingChange(0)}
              className="ml-auto font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500 hover:text-white"
            >
              Limpar
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onSave}
          className="mt-6 flex h-11 w-full items-center justify-center rounded-lg bg-[#d4af37] font-mono text-xs font-bold uppercase tracking-wide text-black hover:bg-[#ebdcb9]"
        >
          Salvar ticket
        </button>
      </div>
    </div>
  );
}

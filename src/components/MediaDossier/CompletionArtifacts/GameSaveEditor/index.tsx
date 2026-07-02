import { useState, type MouseEvent } from "react";
import { Star, X } from "lucide-react";
import type { GameSaveEditorProps } from "../types";

export function GameSaveEditor({
  item,
  finishedAt,
  rating,
  hoursPlayed,
  completionType,
  stars,
  onFinishedAtChange,
  onRatingChange,
  onHoursPlayedChange,
  onCompletionTypeChange,
  onClose,
  onSave,
}: GameSaveEditorProps) {
  const [previewRating, setPreviewRating] = useState<number | null>(null);
  const visibleRating = previewRating ?? rating;

  const getRatingFromMouse = (event: MouseEvent<HTMLButtonElement>, star: number) => {
    const { left, width } = event.currentTarget.getBoundingClientRect();
    const isLeftHalf = event.clientX - left <= width / 2;

    return isLeftHalf ? star - 0.5 : star;
  };

  return (
    <div className="absolute inset-0 z-20 flex items-end bg-black/60 p-5 backdrop-blur-sm">
      <div className="w-full rounded-xl border border-white/10 bg-[#202024] p-5 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-noir-gold">
              Save finalizado
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
            Data de conclusao
            <input
              type="date"
              value={finishedAt}
              onChange={(event) => onFinishedAtChange(event.target.value)}
              className="rounded-lg border border-white/10 bg-[#151518] px-3 py-3 text-sm font-medium normal-case tracking-normal text-white outline-none focus:border-noir-gold"
            />
          </label>

          <label className="flex flex-col gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
            Horas jogadas
            <input
              type="number"
              min="0"
              step="0.5"
              value={hoursPlayed}
              onChange={(event) => onHoursPlayedChange(event.target.value)}
              className="rounded-lg border border-white/10 bg-[#151518] px-3 py-3 text-sm font-medium normal-case tracking-normal text-white outline-none focus:border-noir-gold"
            />
          </label>
        </div>

        <label className="mt-4 flex flex-col gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
          Tipo de conclusao
          <input
            placeholder="Campanha, 100%, platina..."
            value={completionType}
            onChange={(event) => onCompletionTypeChange(event.target.value)}
            className="rounded-lg border border-white/10 bg-[#151518] px-3 py-3 text-sm font-medium normal-case tracking-normal text-white outline-none focus:border-noir-gold"
          />
        </label>

        <div className="mt-5">
          <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
            Nota em estrelas
          </p>
          <div className="flex items-center gap-2" onMouseLeave={() => setPreviewRating(null)}>
            {stars.map((star) => (
              <button
                key={star}
                type="button"
                onClick={(event) => onRatingChange(getRatingFromMouse(event, star))}
                onMouseMove={(event) => setPreviewRating(getRatingFromMouse(event, star))}
                className="transition-transform hover:scale-110"
              >
                <span className="relative inline-flex">
                  <Star size={26} className="text-neutral-600" />
                  {visibleRating > star - 1 && (
                    <span
                      className="absolute inset-0 overflow-hidden"
                      style={{ width: `${Math.min(1, visibleRating - (star - 1)) * 100}%` }}
                    >
                      <Star size={26} className="fill-current text-noir-gold" />
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onSave}
          className="mt-6 flex h-11 w-full items-center justify-center rounded-lg bg-[#d4af37] font-mono text-xs font-bold uppercase tracking-wide text-black hover:bg-[#ebdcb9]"
        >
          Salvar save
        </button>
      </div>
    </div>
  );
}

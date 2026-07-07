import { useState } from "react";
import { Star } from "lucide-react";
import { formatDateInput } from "../../utils";
import type { GameSaveCardProps } from "../types";
import { getRatingFromMouse } from "../utils";

const completionTypeOptions = ["Campanha", "Completo", "Platina"];

function renderStars(
  rating: number,
  onPreviewRating: (rating: number) => void,
  onRatingChange: (rating: number) => void,
  onSave: GameSaveCardProps["onSave"]
) {
  return Array.from({ length: 5 }, (_, index) => {
    const star = index + 1;
    const fillPercentage = Math.max(0, Math.min(1, rating - index)) * 100;

    return (
      <button
        key={star}
        type="button"
        className="relative inline-flex transition-transform hover:scale-110"
        onClick={(event) => {
          const nextRating = getRatingFromMouse(event, star);

          onRatingChange(nextRating);
          void onSave({ rating: nextRating });
        }}
        onMouseMove={(event) => onPreviewRating(getRatingFromMouse(event, star))}
        aria-label={`Dar nota ate ${star}`}
      >
        <span className="relative inline-flex">
          <Star size={14} className="text-emerald-200/25" />
          {fillPercentage > 0 && (
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercentage}%` }}>
              <Star size={14} className="fill-emerald-200 text-emerald-200" />
            </span>
          )}
        </span>
      </button>
    );
  });
}

export function GameSaveCard({
  item,
  finishedAt,
  rating,
  hoursPlayed,
  completionType,
  onFinishedAtChange,
  onRatingChange,
  onHoursPlayedChange,
  onCompletionTypeChange,
  onSave,
}: GameSaveCardProps) {
  const [previewRating, setPreviewRating] = useState<number | null>(null);
  const visibleRating = previewRating ?? rating;

  return (
    <div
      className="group mt-8 w-full text-left transition-transform duration-300 hover:-translate-y-1"
      onMouseLeave={() => setPreviewRating(null)}
    >
      <div className="relative mx-auto max-w-[340px] rounded-[18px] border border-white/10 bg-[#2b2c30] p-5 text-zinc-100 shadow-[0_28px_60px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="pointer-events-none absolute inset-0 rounded-[18px] bg-[linear-gradient(135deg,rgba(255,255,255,0.10),transparent_32%,rgba(0,0,0,0.30))]" />
        <span className="absolute left-4 top-4 h-2.5 w-2.5 rounded-full border border-black/60 bg-[#15161a] shadow-[inset_0_1px_1px_rgba(255,255,255,0.16)]" />
        <span className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full border border-black/60 bg-[#15161a] shadow-[inset_0_1px_1px_rgba(255,255,255,0.16)]" />

        <div className="relative">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[9px] font-black uppercase tracking-[0.24em] text-white/50">
                Horizon Save
              </p>
              <p className="mt-1 font-mono text-[28px] font-black leading-none text-white/70">
                8<span className="ml-1 text-sm">MB</span>
              </p>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                Memory Card
              </p>
            </div>

            <input
              type="text"
              value={finishedAt}
              onChange={(event) => onFinishedAtChange(formatDateInput(event.target.value))}
              onBlur={(event) => void onSave({ finishedAt: event.currentTarget.value })}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }
              }}
              placeholder="2020 ou 05/02/2020"
              inputMode="numeric"
              className="w-[104px] rounded bg-black/25 px-2 py-1 text-right font-mono text-[9px] font-bold text-white/55 outline-none transition-colors focus:bg-black/40 focus:text-white"
            />
          </div>

          <div className="mb-5 h-px bg-black/40 shadow-[0_1px_0_rgba(255,255,255,0.08)]" />

          <div className="rounded-[14px] border border-black/35 bg-[#202126] p-4 shadow-[inset_0_1px_4px_rgba(0,0,0,0.55)]">
            <p className="font-mono text-[8px] font-bold uppercase tracking-[0.22em] text-noir-gold">
              Save data finalizado
            </p>
            <h3 className="mt-2 font-serif text-2xl font-extrabold leading-none text-white">
              {item.title}
            </h3>
            <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
              {item.creator || "Estudio nao informado"}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/35">
                  Play time
                </p>
                <div className="mt-1 flex items-center gap-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={hoursPlayed}
                    onChange={(event) => onHoursPlayedChange(event.target.value)}
                    onBlur={(event) => void onSave({ hoursPlayed: event.currentTarget.value })}
                    placeholder="--"
                    className="w-full bg-transparent font-mono text-sm font-bold text-white outline-none placeholder:text-white/35"
                  />
                  <span className="font-mono text-xs font-bold text-white/45">h</span>
                </div>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/35">
                  Clear type
                </p>
                <select
                  value={completionType}
                  onChange={(event) => {
                    onCompletionTypeChange(event.target.value);
                    void onSave({ completionType: event.target.value });
                  }}
                  className="mt-1 w-full truncate bg-transparent font-mono text-sm font-bold text-white outline-none"
                >
                  {completionTypeOptions.map((option) => (
                    <option key={option} value={option} className="bg-[#202126] text-white">
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-1">
              {renderStars(visibleRating, setPreviewRating, onRatingChange, onSave)}
            </div>
          </div>
        </div>

        <div className="absolute -bottom-1 left-8 right-8 h-4 rounded-b-xl border-x border-b border-black/45 bg-[#191a1e]" />
        <div className="absolute -left-1 bottom-8 flex flex-col gap-1.5">
          {Array.from({ length: 5 }, (_, index) => (
            <span key={index} className="h-3 w-2 rounded-r bg-black/45" />
          ))}
        </div>
        <div className="absolute -right-1 bottom-8 flex flex-col gap-1.5">
          {Array.from({ length: 5 }, (_, index) => (
            <span key={index} className="h-3 w-2 rounded-l bg-black/45" />
          ))}
        </div>
      </div>
    </div>
  );
}

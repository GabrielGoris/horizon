import { Star } from "lucide-react";
import { formatTicketDate } from "../../utils";
import type { MovieTicketProps } from "../types";

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, index) => {
    const fillPercentage = Math.max(0, Math.min(1, rating - index)) * 100;

    return (
      <span key={index} className="relative inline-flex">
        <Star size={15} className="text-black/25" />
        {fillPercentage > 0 && (
          <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercentage}%` }}>
            <Star size={15} className="fill-black text-black" />
          </span>
        )}
      </span>
    );
  });
}

export function MovieTicket({ item, watchedAt, rating, onClick }: MovieTicketProps) {
  const hasRating = rating > 0;
  const isSeries = item.type === "movies" && item.movie_kind === "series";
  const director = item.director || "Diretor nao informado";

  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-8 w-full overflow-hidden rounded-lg bg-[#e7c965] text-left text-black shadow-[0_18px_45px_rgba(212,175,55,0.22)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(212,175,55,0.28)]"
    >
      <div className="relative flex min-h-[100px] items-stretch">
        <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#17171a]" />
        <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#17171a]" />

        <div className="flex flex-1 flex-col justify-between px-7 py-4">
          <div className="flex items-center gap-2 font-mono text-[8px] font-bold uppercase tracking-[0.22em] text-black/55">
            <span>{director}</span>
            <span>-</span>
            <span>{formatTicketDate(watchedAt)}</span>
          </div>

          <div>
            {isSeries && (
              <p className="mb-1 font-mono text-[8px] font-black uppercase tracking-[0.22em] text-black/55">
                Série assistida
              </p>
            )}
            <h3 className="font-serif text-xl font-extrabold uppercase leading-none text-black">
              {item.title}
            </h3>
            <div className="mt-3 flex items-center gap-1">
              {renderStars(rating)}
            </div>
          </div>
        </div>

        <div className="flex w-[86px] flex-col items-center justify-center border-l border-dashed border-black/25 bg-white/20 px-3">
          <span className="font-mono text-lg font-black text-black">
            {hasRating ? rating.toFixed(1) : "--"}
          </span>
          <Star size={13} className={hasRating ? "fill-black text-black" : "text-black/30"} />
        </div>
      </div>
    </button>
  );
}

import { Star } from "lucide-react";
import { RatingStars } from "../../../RatingStars";
import { formatDateInput } from "../../utils";
import type { MovieTicketProps } from "../types";

export function MovieTicket({
  item,
  watchedAt,
  rating,
  onWatchedAtChange,
  onRatingChange,
  onSave,
}: MovieTicketProps) {
  const hasRating = rating > 0;
  const director = item.director || "Diretor nao informado";

  return (
    <div className="mt-8 w-full overflow-hidden rounded-lg bg-[#e7c965] text-left text-black shadow-[0_18px_45px_rgba(212,175,55,0.22)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(212,175,55,0.28)]">
      <div className="relative flex min-h-[100px] items-stretch">
        <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#17171a]" />
        <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#17171a]" />

        <div className="flex flex-1 flex-col justify-between px-7 py-4">
          <div className="flex items-center gap-2 font-mono text-[8px] font-bold uppercase tracking-[0.22em] text-black/55">
            <span>{director}</span>
            <span>-</span>
            <input
              type="text"
              value={watchedAt}
              onChange={(event) => onWatchedAtChange(formatDateInput(event.target.value))}
              onBlur={(event) => void onSave({ watchedAt: event.currentTarget.value })}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }
              }}
              placeholder="2020 ou 05/02/2020"
              inputMode="numeric"
              className="w-[92px] rounded bg-black/5 px-1 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-black/70 outline-none transition-colors focus:bg-black/10 focus:text-black"
            />
          </div>

          <div>
            <h3 className="font-serif text-xl font-extrabold uppercase leading-none text-black">
              {item.title}
            </h3>
            <RatingStars
              value={rating}
              onChange={onRatingChange}
              onCommit={(nextRating) => onSave({ rating: nextRating })}
              size={15}
              emptyClassName="text-black/25"
              filledClassName="fill-black text-black"
              className="mt-3 flex items-center gap-1"
            />
          </div>
        </div>

        <div className="flex w-[86px] flex-col items-center justify-center border-l border-dashed border-black/25 bg-white/20 px-3">
          <span className="font-mono text-lg font-black text-black">
            {hasRating ? rating.toFixed(1) : "--"}
          </span>
          <Star size={13} className={hasRating ? "fill-black text-black" : "text-black/30"} />
        </div>
      </div>
    </div>
  );
}

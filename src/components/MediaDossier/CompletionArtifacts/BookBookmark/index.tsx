import { RatingStars } from "../../../RatingStars";
import { formatDateInput } from "../../utils";
import type { BookBookmarkProps } from "../types";

export function BookBookmark({
  item,
  finishedAt,
  rating,
  onFinishedAtChange,
  onRatingChange,
  onSave,
}: BookBookmarkProps) {
  const pageCount = item.page_count ? `${item.page_count} páginas` : "Páginas nao informadas";

  return (
    <div className="mt-8 w-full rounded-md border border-[#d4af37]/25 bg-[#e7d8aa] p-5 text-left text-[#23190d] shadow-[0_18px_45px_rgba(212,175,55,0.16)] transition-transform duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between gap-4 border-b border-[#3a2d18]/15 pb-4">
        <div>
          <p className="font-mono text-[8px] font-black uppercase tracking-[0.24em] text-[#3a2d18]/55">
            Leitura concluida
          </p>
          <h3 className="mt-2 font-serif text-2xl font-extrabold leading-none">
            {item.title}
          </h3>
          <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#3a2d18]/55">
          {item.creator || "Autor nao informado"}
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
          className="w-[104px] rounded-sm bg-[#3a2d18]/10 px-2 py-1 font-mono text-[9px] font-bold text-[#23190d] outline-none transition-colors focus:bg-[#3a2d18]/15"
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <RatingStars
          value={rating}
          onChange={onRatingChange}
          onCommit={(nextRating) => onSave({ rating: nextRating })}
          emptyClassName="text-[#3a2d18]/25"
          filledClassName="fill-[#3a2d18] text-[#3a2d18]"
        />
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#3a2d18]/60">
          {pageCount}
        </span>
      </div>
    </div>
  );
}

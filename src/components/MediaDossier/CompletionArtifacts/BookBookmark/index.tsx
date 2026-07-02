import { Star } from "lucide-react";
import { formatTicketDate } from "../../utils";
import type { BookBookmarkProps } from "../types";

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, index) => {
    const fillPercentage = Math.max(0, Math.min(1, rating - index)) * 100;

    return (
      <span key={index} className="relative inline-flex">
        <Star size={14} className="text-[#3a2d18]/25" />
        {fillPercentage > 0 && (
          <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercentage}%` }}>
            <Star size={14} className="fill-[#3a2d18] text-[#3a2d18]" />
          </span>
        )}
      </span>
    );
  });
}

export function BookBookmark({ item, finishedAt, rating, pages, onClick }: BookBookmarkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-8 w-full rounded-md border border-[#d4af37]/25 bg-[#e7d8aa] p-5 text-left text-[#23190d] shadow-[0_18px_45px_rgba(212,175,55,0.16)] transition-transform duration-300 hover:-translate-y-1"
    >
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
        <span className="rounded-sm bg-[#3a2d18]/10 px-2 py-1 font-mono text-[9px] font-bold">
          {formatTicketDate(finishedAt)}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1">{renderStars(rating)}</div>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#3a2d18]/60">
          {pages ? `${pages} paginas` : "Paginas nao informadas"}
        </span>
      </div>
    </button>
  );
}

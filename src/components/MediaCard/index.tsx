import { ListPlus } from "lucide-react";
import { getGamePlatformOption } from "../../consts/gamePlatforms";
import { GamePlatformLogo } from "../GamePlatformLogo";
import type { MediaCardProps } from "./types";

function getTypeLabel(item: MediaCardProps["item"]) {
  if (item.type === "movies" && item.movie_kind === "series") return "Série";
  if (item.type === "movies") return "Filme";
  if (item.type === "games") return "Jogo";

  return "Livro";
}

export function MediaCard({ item, onClick, onPrioritize, rank }: MediaCardProps) {
  const isBook = item.type === 'books';
  const typeLabel = getTypeLabel(item);
  const platform = item.type === "games" ? getGamePlatformOption(item.meta) : null;
  const coverUrl = item.cover?.trim();
  const clipPath = isBook
    ? "inset(0 round 0.375rem 0.75rem 0.75rem 0.375rem)"
    : "inset(0 round 0.75rem)";
  
  return (
    <div 
      onClick={() => onClick && onClick(item)}
      className={`group relative isolate transform-gpu overflow-hidden bg-[#1a1a1e] border border-white/5 cursor-pointer shadow-lg transition-all duration-500 will-change-transform [backface-visibility:hidden] hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(0,0,0,0.6)] hover:border-[#d4af37]/30 aspect-[2/3] ${
        isBook ? 'rounded-r-xl rounded-l-md' : 'rounded-xl'
      }`}
      style={{ clipPath }}
    >
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={item.title}
          className="block h-full w-full rounded-[inherit] object-cover filter saturate-[0.65] sepia-[0.18] contrast-[1.08] brightness-[0.82] transition-all duration-600 transform-gpu [backface-visibility:hidden] group-hover:saturate-100 group-hover:sepia-0 group-hover:contrast-100 group-hover:brightness-100 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-[inherit] bg-white/[0.04] font-mono text-[10px] uppercase tracking-widest text-neutral-600">
          Sem capa
        </div>
      )}

      {isBook && (
        <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/60 via-white/10 to-transparent z-10 border-r border-black/20" />
      )}
      
      <div className="absolute top-3 left-3 z-30 flex flex-col gap-1.5">
        {rank ? (
          <span className="w-8 h-8 rounded-lg bg-[#d4af37] text-black flex items-center justify-center font-serif font-extrabold text-sm shadow-lg">
            #{rank}
          </span>
        ) : (
          <>
            <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded border bg-[#131315]/80 text-[#ebdcb9] border-[#d4af37]/30 backdrop-blur-md">
              {typeLabel}
            </span>
            {platform && (
              <span className="inline-flex items-center gap-1 rounded border border-white/10 bg-black/65 px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-widest text-white/80 backdrop-blur-md">
                <GamePlatformLogo platform={platform} compact className="h-3 w-3" />
                {platform.label}
              </span>
            )}
          </>
        )}
      </div>

      {onPrioritize && (
        <button
          type="button"
          aria-label="Editar lista de prioridade"
          onClick={(event) => {
            event.stopPropagation();
            onPrioritize(item);
          }}
          className="absolute right-3 top-3 z-30 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#131315]/80 text-[#ebdcb9] opacity-0 shadow-lg backdrop-blur-md transition-all hover:border-[#d4af37]/50 hover:text-[#d4af37] group-hover:opacity-100"
        >
          <ListPlus size={15} />
        </button>
      )}

      <div className="absolute inset-0 z-20 flex flex-col justify-end rounded-[inherit] bg-gradient-to-t from-[#0a0a0c] via-black/50 to-transparent p-5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span className="text-[9px] font-bold uppercase tracking-widest text-[#d4af37] mb-1 drop-shadow-md">
          {item.creator}
        </span>
        <h4 className="font-serif font-bold text-sm text-white leading-tight mb-2 drop-shadow-lg">
          {item.title}
        </h4>
        
        {item.progress && (
          <div className="w-full bg-black/50 h-1 rounded-full overflow-hidden border border-white/10 mt-1">
            <div 
              className="bg-gradient-to-r from-[#d4af37] to-[#ebdcb9] h-full" 
              style={{ width: `${(item.progress.current / item.progress.total) * 100}%` }} 
            />
          </div>
        )}
      </div>
    </div>
  );
}

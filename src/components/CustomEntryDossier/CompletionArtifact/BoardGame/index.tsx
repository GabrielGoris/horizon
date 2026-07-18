import { Check } from "lucide-react";
import { ArtifactFields } from "../ArtifactFields";
import type { CompletionArtifactLayoutProps } from "../types";
import { formatCompletedDate } from "../utils";

const TRACK_SPACES = Array.from({ length: 6 }, (_, index) => index);

export function BoardGame({ entry, ...props }: CompletionArtifactLayoutProps) {
  const completedDate = formatCompletedDate(entry.completed_at);

  return (
    <section className="mt-8 border-t border-white/10 pt-7">
      <div className="relative overflow-hidden rounded-2xl border-[7px] border-[#694b2c] bg-[#173b32] p-10 shadow-[0_24px_55px_rgba(0,0,0,0.38),inset_0_0_0_2px_rgba(255,255,255,0.08)]">
        <BoardTrack />

        <div className="relative rounded-xl border border-emerald-100/15 bg-[#102a24]/95 p-5 shadow-[0_12px_28px_rgba(0,0,0,0.3)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[8px] font-black uppercase tracking-[0.24em] text-emerald-200">Ficha de partida</p>
              <h3 className="mt-1 font-serif text-2xl font-extrabold text-white">{entry.title}</h3>
            </div>
            <span className="flex shrink-0 items-center gap-1 rounded-md bg-emerald-200/10 px-2 py-1 font-mono text-[7px] font-bold uppercase text-emerald-100">
              <Check size={9} /> Fim de jogo
            </span>
          </div>
          <p className="mt-2 font-mono text-[8px] uppercase tracking-wider text-white/35">Sessão concluída {completedDate && `· ${completedDate}`}</p>

          {props.fields.length > 0 && <div className="my-4 border-t border-dashed border-emerald-100/15" />}
          <ArtifactFields {...props} buttonClass="bg-emerald-200 text-[#10231e] hover:bg-emerald-100" />
        </div>
      </div>
    </section>
  );
}

function BoardTrack() {
  return (
    <div className="pointer-events-none absolute inset-2 flex flex-col justify-between">
      {[0, 1].map((row) => (
        <div key={row} className="grid grid-cols-6 gap-1">
          {TRACK_SPACES.map((space) => (
            <span key={space} className={`aspect-square rounded-sm border border-white/10 ${space % 3 === 0 ? "bg-amber-200/20" : space % 2 === 0 ? "bg-rose-200/15" : "bg-emerald-100/10"}`} />
          ))}
        </div>
      ))}
      <span className="absolute left-1 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-amber-200 shadow-[0_2px_4px_rgba(0,0,0,0.4)]" />
      <span className="absolute right-1 top-1/3 h-3 w-3 rounded-full bg-rose-200 shadow-[0_2px_4px_rgba(0,0,0,0.4)]" />
    </div>
  );
}

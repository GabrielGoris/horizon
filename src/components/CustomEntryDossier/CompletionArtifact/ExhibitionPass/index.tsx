import { Check, Landmark } from "lucide-react";
import { ArtifactFields } from "../ArtifactFields";
import type { CompletionArtifactLayoutProps } from "../types";
import { formatCompletedDate } from "../utils";

export function ExhibitionPass({ entry, ...props }: CompletionArtifactLayoutProps) {
  const completedDate = formatCompletedDate(entry.completed_at);

  return (
    <section className="mt-8 border-t border-white/10 pt-7">
      <div className="relative overflow-hidden rounded-2xl border border-stone-400/25 bg-stone-900 px-5 py-6 text-stone-100 shadow-[0_24px_55px_rgba(0,0,0,0.4)] sm:px-7">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-stone-700/25 via-transparent to-black/20" />

        <header className="relative flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[8px] font-black uppercase tracking-[0.3em] text-amber-100/65">Museu · registro de exposição</p>
            <p className="mt-1 font-mono text-[7px] uppercase tracking-[0.2em] text-stone-500">Arquivo de visita</p>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full border border-amber-100/20 bg-amber-100/5 px-2 py-1 font-mono text-[7px] font-bold uppercase tracking-wider text-amber-100">
            <Check size={9} /> Visitada
          </span>
        </header>

        <div className="relative mx-auto mt-6 max-w-sm">
          <div className="mx-auto flex h-12 w-[86%] items-end justify-center bg-stone-300 pb-1 text-stone-800 [clip-path:polygon(50%_0,100%_100%,0_100%)]">
            <Landmark size={19} strokeWidth={1.6} />
          </div>
          <div className="h-2 border-y border-stone-500 bg-stone-300" />

          <div className="flex items-stretch justify-between gap-3 px-3 pt-2">
            <div className="flex gap-2">
              <span className="w-2.5 border-x border-stone-500 bg-gradient-to-r from-stone-600 via-stone-300 to-stone-600" />
              <span className="w-2.5 border-x border-stone-500 bg-gradient-to-r from-stone-600 via-stone-300 to-stone-600" />
            </div>

            <div className="min-w-0 flex-1 py-3 text-center">
              <p className="font-mono text-[7px] font-black uppercase tracking-[0.24em] text-stone-500">Exposição visitada</p>
              <h3 className="mt-2 font-serif text-2xl font-extrabold leading-tight text-stone-50">{entry.title}</h3>
              <p className="mt-2 font-serif text-sm font-bold italic text-amber-100">Acervo contemplado</p>
              {completedDate && <p className="mt-1 font-mono text-[8px] text-stone-500">{completedDate}</p>}
            </div>

            <div className="flex gap-2">
              <span className="w-2.5 border-x border-stone-500 bg-gradient-to-r from-stone-600 via-stone-300 to-stone-600" />
              <span className="w-2.5 border-x border-stone-500 bg-gradient-to-r from-stone-600 via-stone-300 to-stone-600" />
            </div>
          </div>

          <div className="h-2 border-y border-stone-500 bg-stone-300" />
        </div>

        {props.fields.length > 0 && (
          <div className="relative mt-6 border-t border-dashed border-stone-500/40 pt-5">
            <ArtifactFields {...props} buttonClass="bg-stone-200 text-stone-900 hover:bg-white" />
          </div>
        )}
      </div>
    </section>
  );
}

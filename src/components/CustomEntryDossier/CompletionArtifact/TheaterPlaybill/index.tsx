import { Check, Drama } from "lucide-react";
import { ArtifactFields } from "../ArtifactFields";
import type { CompletionArtifactLayoutProps } from "../types";
import { formatCompletedDate } from "../utils";

export function TheaterPlaybill({ entry, ...props }: CompletionArtifactLayoutProps) {
  const completedDate = formatCompletedDate(entry.completed_at);

  return (
    <section className="mt-8 border-t border-white/10 pt-7">
      <div className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-red-950 px-5 py-7 text-amber-50 shadow-[0_24px_55px_rgba(0,0,0,0.42)] sm:px-7">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 border-r border-red-300/20 shadow-[12px_0_26px_rgba(0,0,0,0.35)] [background-image:repeating-linear-gradient(90deg,#450a0a_0,#7f1d1d_12px,#991b1b_22px,#450a0a_34px)]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 border-l border-red-300/20 shadow-[-12px_0_26px_rgba(0,0,0,0.35)] [background-image:repeating-linear-gradient(90deg,#450a0a_0,#991b1b_12px,#7f1d1d_22px,#450a0a_34px)]" />

        <div className="relative mx-auto max-w-[72%] text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-amber-200/30 bg-red-900/60 shadow-inner">
            <Drama className="text-amber-200" size={23} strokeWidth={1.5} />
          </span>
          <p className="mt-3 font-mono text-[8px] font-black uppercase tracking-[0.32em] text-amber-200/70">Programa de espetáculo</p>
          <h3 className="mt-3 font-serif text-3xl font-extrabold leading-tight text-[#fff5df]">{entry.title}</h3>
          <div className="mx-auto my-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-amber-200/30" />
            <span className="flex items-center gap-1 rounded-full border border-amber-200/20 px-2 py-1 font-mono text-[7px] font-bold uppercase tracking-wider text-amber-100">
              <Check size={9} /> Assistido
            </span>
            <span className="h-px flex-1 bg-amber-200/30" />
          </div>
          <p className="font-serif text-base font-bold italic text-amber-200">Espetáculo encerrado</p>
          {completedDate && <p className="mt-1 font-mono text-[9px] text-[#f7ead1]/40">{completedDate}</p>}
        </div>

        {props.fields.length > 0 && (
          <div className="relative mt-7 rounded-xl border border-amber-200/15 bg-red-950/90 p-4 shadow-lg backdrop-blur-sm">
            <ArtifactFields {...props} buttonClass="bg-amber-200 text-red-950 hover:bg-amber-100" />
          </div>
        )}
      </div>
    </section>
  );
}

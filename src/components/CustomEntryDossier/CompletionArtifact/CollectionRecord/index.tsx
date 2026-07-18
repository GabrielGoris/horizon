import { Check, ShieldCheck } from "lucide-react";
import { ArtifactFields } from "../ArtifactFields";
import type { CompletionArtifactLayoutProps } from "../types";
import { formatCompletedDate } from "../utils";

export function CollectionRecord({ entry, ...props }: CompletionArtifactLayoutProps) {
  const completedDate = formatCompletedDate(entry.completed_at);
  const inventoryNumber = `HZN-${entry.id.replaceAll("-", "").slice(0, 6).toUpperCase()}`;

  return (
    <section className="mt-8 border-t border-white/10 pt-7">
      <div className="relative overflow-hidden rounded-xl border border-amber-100/20 bg-[linear-gradient(145deg,#302b20,#211e18)] p-6 text-amber-50 shadow-[0_26px_55px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.07)]">
        <span className="absolute left-5 top-0 h-3 w-32 rounded-b-md bg-amber-100/20" />
        <span className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full border border-amber-100/5" />

        <header className="relative flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[8px] font-black uppercase tracking-[0.25em] text-amber-100/55">Inventário Horizon</p>
            <h3 className="mt-2 font-serif text-2xl font-extrabold text-white">{entry.title}</h3>
            <p className="mt-2 font-mono text-[9px] font-bold tracking-[0.16em] text-amber-100/40">{inventoryNumber}</p>
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-amber-100/20 bg-amber-100/10 text-amber-100">
            <ShieldCheck size={20} />
          </span>
        </header>

        <div className="relative my-5 border-t border-double border-amber-100/15" />

        <div className="relative flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[7px] font-bold uppercase tracking-[0.22em] text-amber-100/35">Estado do inventário</p>
            <p className="mt-1 flex items-center gap-1.5 font-serif text-lg font-bold italic text-amber-100">
              <Check size={13} /> Peça incorporada ao acervo
            </p>
          </div>
          {completedDate && <span className="shrink-0 font-mono text-[8px] text-amber-100/35">{completedDate}</span>}
        </div>

        {props.fields.length > 0 && <div className="relative my-5 border-t border-dashed border-amber-100/15" />}
        <div className="relative">
          <ArtifactFields {...props} buttonClass="bg-amber-100 text-[#282217] hover:bg-amber-50" />
        </div>

        <footer className="relative mt-6 flex items-center justify-between border-t border-amber-100/10 pt-3 font-mono text-[7px] font-bold uppercase tracking-[0.18em] text-amber-100/25">
          <span>Registro de autenticidade</span>
          <span className="rounded-full border border-amber-100/15 px-2 py-1 text-amber-100/55">No acervo</span>
        </footer>
      </div>
    </section>
  );
}

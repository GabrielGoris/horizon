import { Check } from "lucide-react";
import { CustomCategoryIcon } from "../../../CustomCategoryIcon";
import { ArtifactFields } from "../ArtifactFields";
import type { CompletionArtifactLayoutProps } from "../types";
import { formatCompletedDate } from "../utils";

export function Passport({ category, entry, ...props }: CompletionArtifactLayoutProps) {
  const completedDate = formatCompletedDate(entry.completed_at);
  const documentNumber = entry.id.replaceAll("-", "").slice(0, 9).toUpperCase();

  return (
    <section className="mt-8 border-t border-white/10 pt-7">
      <div className="relative mx-auto max-w-[350px] overflow-hidden rounded-l-md rounded-r-[18px] border border-sky-100/15 bg-[linear-gradient(145deg,#17364b,#102637)] pb-6 pl-9 pr-6 pt-7 text-sky-50 shadow-[0_28px_60px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]">
        <span className="absolute inset-y-0 left-0 w-5 border-r border-sky-100/10 bg-black/15 shadow-[4px_0_10px_rgba(0,0,0,0.18)]" />
        <span className="absolute inset-y-4 left-2 w-px bg-sky-100/10" />
        <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full border border-sky-100/5" />
        <div className="pointer-events-none absolute -right-7 -top-7 h-24 w-24 rounded-full border border-dashed border-sky-100/10" />

        <header className="relative text-center">
          <p className="font-mono text-[8px] font-black uppercase tracking-[0.32em] text-sky-100/50">Horizon</p>
          <span className="mx-auto mt-4 flex h-16 w-16 items-center justify-center rounded-full border border-sky-100/30 outline outline-1 outline-offset-4 outline-sky-100/10">
            <CustomCategoryIcon name={category.icon} size={27} className="text-sky-100/80" />
          </span>
          <h3 className="mt-5 font-serif text-2xl font-extrabold uppercase tracking-[0.12em] text-sky-100">Passaporte</h3>
          <p className="mt-1 font-mono text-[8px] font-bold uppercase tracking-[0.3em] text-sky-100/45">de visita</p>
        </header>

        <div className="relative my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-sky-100/15" />
          <span className="h-1.5 w-1.5 rotate-45 border border-sky-100/30" />
          <span className="h-px flex-1 bg-sky-100/15" />
        </div>

        <div className="relative">
          <p className="font-mono text-[7px] font-bold uppercase tracking-[0.22em] text-sky-100/35">Destino registrado</p>
          <p className="mt-1 font-serif text-2xl font-bold italic text-white">{entry.title}</p>
          <div className="mt-3 flex items-center justify-between gap-3 font-mono text-[8px] uppercase tracking-wider text-sky-100/40">
            <span className="flex items-center gap-1 text-sky-100/65"><Check size={10} /> Visitado</span>
            {completedDate && <span>{completedDate}</span>}
          </div>

          {props.fields.length > 0 && <div className="my-5 border-t border-dashed border-sky-100/15" />}
          <ArtifactFields {...props} buttonClass="bg-sky-200 text-[#102330] hover:bg-sky-100" />
        </div>

        <footer className="relative mt-6 border-t border-sky-100/10 pt-3 font-mono text-[7px] uppercase tracking-[0.2em] text-sky-100/25">
          HZN&lt;VISIT&lt;{documentNumber || "000000000"}
        </footer>
      </div>
    </section>
  );
}

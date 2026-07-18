import { Check } from "lucide-react";
import { ArtifactFields } from "../ArtifactFields";
import type { CompletionArtifactLayoutProps } from "../types";
import { formatCompletedDate } from "../utils";

export function ShoppingBag({ entry, ...props }: CompletionArtifactLayoutProps) {
  const completedDate = formatCompletedDate(entry.completed_at);

  return (
    <section className="mt-8 border-t border-white/10 pt-12">
      <div className="relative mx-auto max-w-[350px]">
        <span className="absolute left-1/2 top-0 h-16 w-32 -translate-x-1/2 -translate-y-8 rounded-t-[50%] border-[9px] border-b-0 border-violet-200/25" />
        <div className="relative min-h-[280px] rounded-b-[28px] rounded-t-lg border border-violet-200/15 bg-[linear-gradient(145deg,#35284a,#241d32)] px-7 pb-7 pt-9 shadow-[0_28px_55px_rgba(0,0,0,0.38)]">
          <span className="absolute left-7 top-0 h-3 w-3 -translate-y-1/2 rounded-full bg-[#17171a] ring-2 ring-violet-100/20" />
          <span className="absolute right-7 top-0 h-3 w-3 -translate-y-1/2 rounded-full bg-[#17171a] ring-2 ring-violet-100/20" />

          <div className="text-center">
            <p className="font-mono text-[8px] font-black uppercase tracking-[0.24em] text-violet-200">Aquisição Horizon</p>
            <h3 className="mt-2 font-serif text-2xl font-extrabold text-white">{entry.title}</h3>
            <p className="mt-2 flex items-center justify-center gap-1 font-mono text-[8px] font-bold uppercase tracking-wider text-violet-100/50">
              <Check size={10} /> Compra registrada {completedDate && `· ${completedDate}`}
            </p>
          </div>

          {props.fields.length > 0 && <div className="my-5 border-t border-dashed border-violet-100/15" />}
          <ArtifactFields {...props} buttonClass="bg-violet-200 text-[#1e172a] hover:bg-violet-100" />
        </div>
      </div>
    </section>
  );
}

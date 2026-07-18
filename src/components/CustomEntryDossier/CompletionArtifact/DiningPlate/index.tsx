import { Check } from "lucide-react";
import { ArtifactFields } from "../ArtifactFields";
import type { CompletionArtifactLayoutProps } from "../types";
import { formatCompletedDate } from "../utils";

export function DiningPlate({ entry, ...props }: CompletionArtifactLayoutProps) {
  const completedDate = formatCompletedDate(entry.completed_at);

  return (
    <section className="mt-8 border-t border-white/10 pt-7">
      <div className="rounded-2xl bg-[linear-gradient(135deg,#211b17,#171412)] p-4 shadow-[0_24px_55px_rgba(0,0,0,0.35)]">
        <div className="relative mx-auto flex min-h-[330px] max-w-[340px] flex-col justify-center overflow-hidden rounded-[48%] border-[12px] border-[#d8d0c1] bg-[#eee8dc] px-12 py-12 text-[#392f27] shadow-[0_15px_30px_rgba(0,0,0,0.35),inset_0_0_0_2px_#a79d8d,inset_0_0_0_12px_#e4ddcf]">
          <div className="pointer-events-none absolute inset-7 rounded-[50%] border border-stone-400/35" />
          <div className="relative text-center">
            <p className="font-mono text-[8px] font-black uppercase tracking-[0.24em] text-stone-500">Mesa encerrada</p>
            <h3 className="mt-2 font-serif text-2xl font-extrabold leading-none">{entry.title}</h3>
            <p className="mt-2 flex items-center justify-center gap-1 font-mono text-[8px] font-bold uppercase tracking-wider text-stone-500">
              <Check size={10} /> Experiência servida {completedDate && `· ${completedDate}`}
            </p>
          </div>

          {props.fields.length > 0 && <div className="relative my-4 border-t border-dashed border-stone-500/25" />}
          <div className="relative">
            <ArtifactFields
              {...props}
              buttonClass="bg-[#5b4434] text-[#f3ecdf] hover:bg-[#483427]"
              inputVariant="artifact-light"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

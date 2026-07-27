import { Check, Video } from "lucide-react";
import { ArtifactFields } from "../ArtifactFields";
import { CompletionDateInput } from "../CompletionDateInput";
import type { CompletionArtifactLayoutProps } from "../types";

function VhsReel() {
  return (
    <span className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[22%] border border-white/15 bg-[#a9afb0] shadow-[inset_0_0_18px_rgba(0,0,0,0.72)]">
      <span className="absolute inset-[12%] rounded-full border-[7px] border-[#656b6c] bg-[#c8cece] shadow-[inset_0_0_10px_rgba(0,0,0,0.55)]" />
      <span className="absolute h-[20%] w-[20%] rounded-full border-[4px] border-[#525859] bg-[#24292a]" />
      <span className="absolute h-[72%] w-[5px] bg-[#697071]/65" />
      <span className="absolute h-[5px] w-[72%] bg-[#697071]/65" />
    </span>
  );
}

export function MediaCassette({ entry, ...props }: CompletionArtifactLayoutProps) {
  return (
    <section className="mt-8 border-t border-white/10 pt-7">
      <div className="mx-auto max-w-[560px]">
        <div className="relative aspect-[1.65/1] overflow-hidden rounded-[20px] border border-white/15 bg-[#17191a] p-[5.5%] shadow-[0_24px_55px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.12)]">
          <span className="pointer-events-none absolute inset-x-[4%] top-[5%] h-[15%] rounded-t-md border border-white/10 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.09)_0,rgba(255,255,255,0.09)_1px,transparent_1px,transparent_4px)]" />
          <span className="pointer-events-none absolute inset-x-[4%] bottom-[5%] h-[13%] bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.07)_0,rgba(255,255,255,0.07)_1px,transparent_1px,transparent_4px)]" />
          <span className="pointer-events-none absolute left-1/2 top-[7%] -translate-x-1/2 border-x-8 border-x-transparent border-b-8 border-b-white/10" />

          <div className="relative mt-[18%] flex h-[62%] items-stretch gap-[3%] rounded-md border border-white/10 bg-[#0e1011] p-[2.5%] shadow-[inset_0_0_14px_rgba(0,0,0,0.9)]">
            <div className="flex w-[25%] items-center rounded-[18%] border border-white/10 bg-[#303536] p-[5%]">
              <VhsReel />
            </div>

            <div className="flex min-w-0 flex-1 flex-col rounded-md border border-black/50 bg-[#2b2e2f] p-[3.5%] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
              <div className="flex items-center justify-between gap-2 font-mono text-[clamp(5px,1.3vw,8px)] font-black uppercase tracking-[0.12em] text-white/75">
                <span>Horizon Video</span>
                <Video size={12} className="shrink-0" />
              </div>
              <div className="mt-[5%] flex flex-1 items-center justify-center border-y border-[#b6b3a9]/50 bg-[#e3e0d3] px-[7%] text-center shadow-inner">
                <h3 className="line-clamp-3 font-serif text-[clamp(12px,3.4vw,23px)] font-extrabold leading-tight text-[#25282a]">{entry.title}</h3>
              </div>
              <div className="mt-[5%] flex items-center justify-between gap-2 font-mono text-[clamp(5px,1.2vw,7px)] font-bold uppercase tracking-wider text-white/45">
                <span>VHS</span>
                <span>Concluído</span>
              </div>
            </div>

            <div className="flex w-[25%] items-center rounded-[18%] border border-white/10 bg-[#303536] p-[5%]">
              <VhsReel />
            </div>
          </div>

          <div className="relative mt-[3%] flex items-center justify-between gap-3 px-[4%] font-mono text-[clamp(5px,1.25vw,8px)] uppercase tracking-[0.16em] text-white/35">
            <span className="flex items-center gap-1 text-white/65"><Check size={10} /> Arquivado</span>
            <CompletionDateInput
              value={props.completedAt}
              onChange={props.onCompletedAtChange}
              onCommit={props.onCompletedAtCommit}
              className="text-right text-white/50 [color-scheme:dark]"
            />
          </div>
        </div>

        {props.fields.length > 0 && (
          <div className="mt-5 border-t border-dashed border-cyan-100/20 pt-5">
            <ArtifactFields {...props} />
          </div>
        )}
      </div>
    </section>
  );
}

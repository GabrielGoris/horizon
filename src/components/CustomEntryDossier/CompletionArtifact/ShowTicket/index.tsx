import { Check, MicVocal, Ticket } from "lucide-react";
import { ArtifactFields } from "../ArtifactFields";
import { CompletionDateInput } from "../CompletionDateInput";
import type { CompletionArtifactLayoutProps } from "../types";

export function ShowTicket({ entry, ...props }: CompletionArtifactLayoutProps) {
  return (
    <section className="mt-8 border-t border-white/10 pt-7">
      <div className="mx-auto max-w-[560px]">
        <div
          className="relative min-h-[238px] overflow-hidden rounded-lg border shadow-[0_22px_50px_rgba(0,0,0,0.45)]"
          style={{ backgroundColor: "#d8c99e", borderColor: "#e8d8ae", color: "#28231f" }}
        >
          <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:repeating-linear-gradient(0deg,transparent_0,transparent_3px,rgba(71,53,70,0.12)_4px),radial-gradient(circle_at_10%_15%,rgba(255,255,255,0.72),transparent_23%),radial-gradient(circle_at_85%_85%,rgba(169,76,122,0.18),transparent_30%)]" />
          <div className="pointer-events-none absolute inset-y-0 right-[30%] border-l-2 border-dashed" style={{ borderColor: "rgba(104, 80, 97, 0.45)" }} />
          <span className="pointer-events-none absolute -right-[10px] top-[25px] h-5 w-5 rounded-full bg-noir-base" />
          <span className="pointer-events-none absolute -right-[10px] bottom-[25px] h-5 w-5 rounded-full bg-noir-base" />

          <div className="relative grid min-h-[238px] grid-cols-[minmax(0,1fr)_30%]">
            <div className="flex min-w-0 flex-col p-5 pr-6 sm:p-6 sm:pr-8">
              <header className="flex items-start justify-between gap-3 border-b pb-3" style={{ borderColor: "rgba(104, 80, 97, 0.35)" }}>
                <div>
                  <p className="font-mono text-[8px] font-black uppercase tracking-[0.3em] text-[#674754]">Horizon Live</p>
                  <p className="mt-1 font-mono text-[7px] font-bold uppercase tracking-[0.2em] text-[#59494a]/70">Ingresso de apresentação</p>
                </div>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border" style={{ backgroundColor: "rgba(179, 117, 142, 0.2)", borderColor: "rgba(114, 80, 94, 0.4)" }}>
                  <MicVocal size={16} className="text-[#674754]" />
                </span>
              </header>

              <div className="my-auto py-5">
                <h3 className="line-clamp-3 font-serif text-[clamp(22px,5vw,34px)] font-extrabold leading-[0.95] text-[#25201d]">{entry.title}</h3>
                <p className="mt-3 font-mono text-[8px] font-bold uppercase tracking-[0.17em] text-[#59494a]/70">Apresente este ingresso para recordar a noite</p>
              </div>

              <footer className="flex items-end justify-between gap-3 border-t pt-3" style={{ borderColor: "rgba(104, 80, 97, 0.3)" }}>
                <span className="flex items-center gap-1.5 font-mono text-[8px] font-black uppercase tracking-wider text-[#674754]"><Check size={11} /> Show assistido</span>
                <CompletionDateInput
                  value={props.completedAt}
                  onChange={props.onCompletedAtChange}
                  onCommit={props.onCompletedAtCommit}
                  className="text-right text-[#59494a] [color-scheme:light]"
                />
              </footer>
            </div>

            <aside className="relative flex min-w-0 flex-col items-center justify-between border-l border-dashed px-2 py-5 text-center sm:px-3 sm:py-6" style={{ backgroundColor: "rgba(196, 178, 135, 0.72)", borderColor: "rgba(104, 80, 97, 0.2)" }}>
              <Ticket size={18} className="text-[#674754]" />
              <div className="-rotate-90 whitespace-nowrap font-mono text-[clamp(8px,1.8vw,10px)] font-black uppercase tracking-[0.24em] text-[#362e2a]">Admit One</div>
              <span className="rounded border border-[#674754]/35 px-1.5 py-1 font-mono text-[7px] font-black uppercase tracking-wider text-[#674754]">HZN 01</span>
            </aside>
          </div>
        </div>

        {props.fields.length > 0 && (
          <div className="mt-5 border-t border-dashed border-fuchsia-100/20 pt-5">
            <ArtifactFields {...props} />
          </div>
        )}
      </div>
    </section>
  );
}

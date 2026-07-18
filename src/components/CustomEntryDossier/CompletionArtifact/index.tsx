import { Check } from "lucide-react";
import { CustomCategoryIcon } from "../../CustomCategoryIcon";
import { ArtifactDecoration } from "./ArtifactDecoration";
import { ArtifactFields } from "./ArtifactFields";
import { BoardGame } from "./BoardGame";
import { CollectionRecord } from "./CollectionRecord";
import { DiningPlate } from "./DiningPlate";
import { ExhibitionPass } from "./ExhibitionPass";
import { Passport } from "./Passport";
import { getCompletionArtifactPreset } from "./presets";
import { ShoppingBag } from "./ShoppingBag";
import { TheaterPlaybill } from "./TheaterPlaybill";
import type { CompletionArtifactLayoutProps } from "./types";
import { formatCompletedDate } from "./utils";

export function CompletionArtifact({
  category,
  entry,
  fields,
  values,
  isSaving,
  onChange,
  onSave,
}: CompletionArtifactLayoutProps) {
  const preset = getCompletionArtifactPreset(category.icon);
  const completedDate = formatCompletedDate(entry.completed_at);
  const layoutProps = { category, entry, fields, values, isSaving, onChange, onSave };

  if (preset.variant === "dining") return <DiningPlate {...layoutProps} />;
  if (preset.variant === "game") return <BoardGame {...layoutProps} />;
  if (preset.variant === "purchase") return <ShoppingBag {...layoutProps} />;
  if (preset.variant === "visit") return <Passport {...layoutProps} />;
  if (preset.variant === "archive") return <CollectionRecord {...layoutProps} />;
  if (preset.variant === "exhibition") return <ExhibitionPass {...layoutProps} />;
  if (preset.variant === "theater") return <TheaterPlaybill {...layoutProps} />;

  return (
    <section className="mt-8 border-t border-white/10 pt-7">
      <div className={`relative overflow-hidden rounded-2xl border p-5 shadow-[0_24px_55px_rgba(0,0,0,0.3)] ${preset.surfaceClass}`}>
        <ArtifactDecoration variant={preset.variant} />

        <div className="relative">
          <header className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${preset.badgeClass}`}>
                <CustomCategoryIcon name={category.icon} size={18} />
              </span>
              <div className="min-w-0">
                <p className={`font-mono text-[8px] font-black uppercase tracking-[0.22em] ${preset.accentClass}`}>{preset.eyebrow}</p>
                <h3 className="mt-1 truncate font-serif text-xl font-extrabold text-white">{entry.title}</h3>
              </div>
            </div>
            <span className={`flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 font-mono text-[7px] font-bold uppercase tracking-wider ${preset.badgeClass}`}>
              <Check size={9} /> Concluído
            </span>
          </header>

          <div className="my-5 h-px bg-white/10" />

          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/35">Estado do registro</p>
              <p className={`mt-1 font-serif text-base font-bold italic ${preset.accentClass}`}>{preset.status}</p>
            </div>
            {completedDate && <span className="font-mono text-[9px] text-white/35">{completedDate}</span>}
          </div>

          {fields.length > 0 && (
            <>
              <div className="my-5 border-t border-dashed border-white/10" />
              <ArtifactFields {...layoutProps} buttonClass={preset.buttonClass} />
            </>
          )}
        </div>
      </div>
    </section>
  );
}

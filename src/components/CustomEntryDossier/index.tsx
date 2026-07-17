import { Check, ChevronDown, ExternalLink, ImagePlus, Images, LoaderCircle, NotebookPen, Pencil, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { CustomEntry, CustomEntryPhoto, CustomEntryStatus, CustomFieldValue, CustomLibraryCategory } from "../../types/customLibrary";
import { formatCustomFieldValue } from "../../utils/customLibrary";
import { CustomCategoryIcon } from "../CustomCategoryIcon";
import { CustomFieldInput } from "../CustomFieldInput";

interface CustomEntryDossierProps {
  category: CustomLibraryCategory;
  entry: CustomEntry;
  onClose: () => void;
  onDelete: (entry: CustomEntry) => void | Promise<void>;
  onDeletePhoto: (entry: CustomEntry, photo: CustomEntryPhoto) => Promise<void>;
  onEdit: (entry: CustomEntry) => void;
  onAddPhotos: (entry: CustomEntry, photos: File[]) => Promise<void>;
  onSaveCompletion: (entry: CustomEntry, values: Record<string, CustomFieldValue>) => Promise<void>;
  onStatusChange: (entry: CustomEntry, status: CustomEntryStatus) => void | Promise<void>;
}

export function CustomEntryDossier({
  category,
  entry,
  onClose,
  onDelete,
  onDeletePhoto,
  onEdit,
  onAddPhotos,
  onSaveCompletion,
  onStatusChange,
}: CustomEntryDossierProps) {
  const [draftValues, setDraftValues] = useState<Record<string, CustomFieldValue>>(() => ({ ...entry.values }));
  const [isSavingCompletion, setIsSavingCompletion] = useState(false);
  const [isSavingPhotos, setIsSavingPhotos] = useState(false);
  const [expandedImageUrl, setExpandedImageUrl] = useState("");
  const [actionError, setActionError] = useState("");
  const coverUrl = entry.cover_url || entry.photos[0]?.signed_url;
  const planningFacts = category.fields
    .filter((field) => field.phase === "planning")
    .map((field) => ({ field, value: formatCustomFieldValue(field, entry.values[field.id]) }))
    .filter((fact) => fact.value);
  const completionFields = category.fields.filter((field) => field.phase === "completion");
  const isCompleted = entry.status === "completed";
  const chipClass = "relative inline-flex h-7 min-w-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-3 font-mono text-[10px] leading-none text-neutral-400";

  const saveCompletion = async () => {
    const missingRequiredField = completionFields.find((field) => {
      if (!field.required) return false;
      const value = draftValues[field.id];
      return value === null || value === "" || (Array.isArray(value) && value.length === 0);
    });

    if (missingRequiredField) {
      setActionError(`Preencha o campo obrigatório “${missingRequiredField.label}”.`);
      return;
    }

    setIsSavingCompletion(true);
    setActionError("");

    try {
      await onSaveCompletion(entry, draftValues);
    } catch (saveError) {
      setActionError(saveError instanceof Error ? saveError.message : "Não foi possível salvar a conclusão.");
    } finally {
      setIsSavingCompletion(false);
    }
  };

  const addPhotos = async (files: File[]) => {
    if (files.length === 0) return;

    setIsSavingPhotos(true);
    setActionError("");

    try {
      await onAddPhotos(entry, files);
    } catch (photoError) {
      setActionError(photoError instanceof Error ? photoError.message : "Não foi possível adicionar as fotos.");
    } finally {
      setIsSavingPhotos(false);
    }
  };

  const removePhoto = async (photo: CustomEntryPhoto) => {
    setIsSavingPhotos(true);
    setActionError("");

    try {
      await onDeletePhoto(entry, photo);
    } catch (photoError) {
      setActionError(photoError instanceof Error ? photoError.message : "Não foi possível remover a foto.");
    } finally {
      setIsSavingPhotos(false);
    }
  };

  return (
    <div className="animate-dossier-overlay-in fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-[6px]">
      <button type="button" aria-label="Fechar dossiê" className="absolute inset-0 cursor-default" onClick={onClose} />

      <aside className="animate-dossier-panel-in relative z-10 flex h-full w-full max-w-[430px] flex-col border-l border-white/10 bg-[#17171a] shadow-[-28px_0_80px_rgba(0,0,0,0.65)]">
        <header className="flex h-[70px] items-center justify-between border-b border-white/10 px-7">
          <div className="flex min-w-0 items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-noir-gold">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
            <span>Dossiê</span>
            <span className="text-neutral-600">-</span>
            <span className="truncate">{category.name_singular}</span>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onEdit(entry)} aria-label="Editar informações" title="Editar informações" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-neutral-400 transition-colors hover:border-noir-gold/30 hover:text-noir-champagne">
              <Pencil size={15} />
            </button>
            <button type="button" onClick={onClose} aria-label="Fechar" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-neutral-400 transition-colors hover:border-white/20 hover:text-white">
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="animate-dossier-content-in flex-1 overflow-y-auto px-7 py-7">
          <div className="relative mx-auto aspect-[4/3] w-full max-w-[360px] overflow-hidden rounded-lg bg-black/25 shadow-[0_18px_45px_rgba(0,0,0,0.38)]">
            {coverUrl ? (
              <button type="button" onClick={() => setExpandedImageUrl(coverUrl)} className="h-full w-full cursor-zoom-in">
                <img src={coverUrl} alt={entry.title} className="h-full w-full object-cover" />
              </button>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-neutral-700">
                <CustomCategoryIcon name={category.icon} size={34} />
                <span className="font-mono text-[9px] uppercase tracking-widest">Sem foto</span>
              </div>
            )}
            {coverUrl && <span className="absolute left-3 top-3 rounded bg-black/70 px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-widest text-white/65 backdrop-blur-sm">Capa</span>}
          </div>

          <div className="mt-8 text-center">
            <h2 className="font-serif text-3xl font-extrabold leading-[1.05] text-white">{entry.title}</h2>
            <p className="mt-3 font-serif text-sm font-bold italic text-noir-gold">{category.name_singular}</p>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <span className={chipClass}>
                <CustomCategoryIcon name={category.icon} size={11} className="mr-1.5" />
                {category.name_plural}
              </span>
              <label className={`${chipClass} px-0`}>
                <span className="sr-only">Alterar estado</span>
                <select
                  value={entry.status}
                  onChange={(event) => void onStatusChange(entry, event.target.value as CustomEntryStatus)}
                  className="h-full cursor-pointer appearance-none rounded-full border-0 bg-transparent pl-3 pr-7 text-center font-mono text-[10px] text-neutral-400 outline-none transition hover:text-noir-champagne"
                >
                  <option value="planned" className="bg-[#17171a] text-neutral-200">{category.planned_label}</option>
                  <option value="completed" className="bg-[#17171a] text-neutral-200">{category.completed_label}</option>
                </select>
                <ChevronDown size={10} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              </label>
            </div>
          </div>

          <FactSection title="Planejamento" facts={planningFacts} />

          {isCompleted && completionFields.length > 0 && (
            <section className="mt-8 border-t border-white/10 pt-7">
              <div className="mb-6 flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-noir-gold/10 text-noir-gold">
                  <NotebookPen size={15} />
                </span>
                <div>
                  <p className="font-serif text-lg font-bold italic text-noir-champagne">Registro da experiência</p>
                  <p className="mt-1 text-xs leading-5 text-neutral-600">Detalhes preenchidos depois de concluir.</p>
                </div>
              </div>
              <div className="grid gap-4">
                {completionFields.map((field) => (
                  <CustomFieldInput
                    key={field.id}
                    field={field}
                    value={draftValues[field.id]}
                    onChange={(value) => setDraftValues((current) => ({ ...current, [field.id]: value }))}
                    variant="dossier"
                  />
                ))}
              </div>
              <button type="button" onClick={() => void saveCompletion()} disabled={isSavingCompletion} className="ml-auto mt-6 flex h-9 items-center justify-center gap-2 rounded-lg bg-noir-gold px-4 font-mono text-[9px] font-bold uppercase tracking-wider text-black transition-colors hover:bg-noir-champagne disabled:opacity-50">
                {isSavingCompletion ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}
                Salvar conclusão
              </button>
            </section>
          )}

          <section className="mt-8 border-t border-white/10 pt-7">
            <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-neutral-600">Resumo / Arquivo</p>
            <p className="text-sm leading-7 text-neutral-200">{entry.description || `Nenhuma observação cadastrada para este ${category.name_singular.toLowerCase()}.`}</p>
          </section>

          <section className="mt-8 border-t border-white/10 pt-7">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-neutral-600">Galeria</p>
              <span className="font-mono text-[9px] text-neutral-600">{entry.photos.length} {entry.photos.length === 1 ? "foto" : "fotos"}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {entry.photos.map((photo) => (
                <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-md bg-black/20">
                  <button type="button" onClick={() => photo.signed_url && setExpandedImageUrl(photo.signed_url)} className="h-full w-full cursor-zoom-in">
                    {photo.signed_url && <img src={photo.signed_url} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />}
                  </button>
                  <button type="button" disabled={isSavingPhotos} aria-label="Remover foto" onClick={() => void removePhoto(photo)} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded bg-black/75 text-red-300 opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-40">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-white/15 text-neutral-600 transition hover:border-noir-gold/35 hover:text-noir-gold" title="Adicionar fotos">
                {isSavingPhotos ? <LoaderCircle size={16} className="animate-spin" /> : <ImagePlus size={17} />}
                <span className="font-mono text-[7px] font-bold uppercase tracking-wider">Adicionar</span>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={isSavingPhotos} className="hidden" onChange={(event) => void addPhotos(Array.from(event.target.files ?? []))} />
              </label>
            </div>
          </section>

          {actionError && <p role="alert" className="mt-5 rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{actionError}</p>}
        </div>

        <footer className="flex items-center gap-3 border-t border-white/10 p-5">
          <button
            type="button"
            onClick={() => void onStatusChange(entry, "completed")}
            disabled={isCompleted}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-noir-gold px-4 font-mono text-xs font-bold uppercase tracking-wide text-black transition-colors hover:bg-noir-champagne disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-neutral-500"
          >
            <Check size={16} />
            {isCompleted ? category.completed_label : `Marcar: ${category.completed_label}`}
          </button>
          <button type="button" onClick={() => void onDelete(entry)} aria-label={`Excluir ${category.name_singular.toLowerCase()}`} className="flex h-11 w-12 items-center justify-center rounded-lg border border-red-500/25 bg-red-500/10 text-red-400 transition-colors hover:border-red-400/40 hover:bg-red-500/15 hover:text-red-300">
            <Trash2 size={17} />
          </button>
        </footer>
      </aside>

      {expandedImageUrl && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 p-6" onClick={() => setExpandedImageUrl("")}>
          <button type="button" aria-label="Fechar foto" onClick={() => setExpandedImageUrl("")} className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/15"><X size={20} /></button>
          <img src={expandedImageUrl} alt={entry.title} className="max-h-full max-w-full object-contain shadow-2xl" />
          <span className="absolute bottom-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-white/50"><Images size={14} /> {entry.title}</span>
        </div>
      )}
    </div>
  );
}

function FactSection({
  facts,
  title,
}: {
  facts: Array<{ field: CustomLibraryCategory["fields"][number]; value: string }>;
  title: string;
}) {
  if (facts.length === 0) return null;

  return (
    <section className="mt-8 border-t border-white/10 pt-7">
      <p className="mb-5 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-neutral-600">{title}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-4">
        {facts.map(({ field, value }) => {
          const externalUrl = field.field_type === "url" ? normalizeExternalUrl(value) : null;

          return (
            <div key={field.id} className={`min-w-0 ${field.field_type === "textarea" ? "col-span-2" : ""}`}>
              <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-600">{field.label}</span>
              {externalUrl ? (
                <a
                  href={externalUrl.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Abrir ${externalUrl.hostname}`}
                  className="group mt-1 inline-flex max-w-full items-center gap-1.5 text-sm font-semibold text-neutral-200 transition-colors hover:text-noir-champagne"
                >
                  <span className="truncate">{externalUrl.hostname.replace(/^www\./, "")}</span>
                  <ExternalLink size={12} className="shrink-0 text-neutral-500 transition-colors group-hover:text-noir-gold" />
                </a>
              ) : (
                <span className="mt-1 block truncate text-sm font-semibold text-neutral-200" title={value}>{value}</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function normalizeExternalUrl(value: string) {
  try {
    const normalizedValue = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(normalizedValue);

    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

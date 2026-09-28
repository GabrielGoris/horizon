import { ImagePlus, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDraftSnapshot, useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import { DuplicateMediaDialog } from "../DuplicateMediaDialog";
import { findDuplicateEntry } from "../../utils/customLibrary/duplicates";
import { getCompletionDateValue } from "../../utils/customLibrary/completionDate";
import { CustomFieldInput } from "../CustomFieldInput";
import { useToast } from "../ToastProvider/hooks/useToast";
import { getYouTubeThumbnailUrl, getYouTubeVideoId } from "../../utils/youtube";
import { fetchYouTubeTitle } from "../../services/youtubeMetadataService";
import type {
  CustomEntry,
  CustomEntryInput,
  CustomEntryPhoto,
  CustomEntryStatus,
  CustomFieldValue,
  CustomLibraryCategory,
} from "../../types/customLibrary";

interface CustomEntryDialogProps {
  entries: CustomEntry[];
  category: CustomLibraryCategory;
  entry?: CustomEntry | null;
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onDeletePhoto?: (photo: CustomEntryPhoto) => Promise<void>;
  onSave: (input: CustomEntryInput, photos: File[]) => Promise<void>;
}

function getInitialValues(category: CustomLibraryCategory, entry?: CustomEntry | null) {
  return category.fields.reduce<Record<string, CustomFieldValue>>((values, field) => {
    values[field.id] = entry?.values[field.id] ?? (field.field_type === "boolean" ? false : field.field_type === "multiselect" ? [] : "");
    return values;
  }, {});
}

export function CustomEntryDialog({
  entries,
  category,
  entry,
  isOpen,
  isSaving,
  onClose: discard,
  onDeletePhoto,
  onSave,
}: CustomEntryDialogProps) {
  const { notify } = useToast();
  const [title, setTitle] = useState(entry?.title ?? "");
  const [coverUrl, setCoverUrl] = useState(entry?.cover_url ?? "");
  const [description, setDescription] = useState(entry?.description ?? "");
  const [status, setStatus] = useState<CustomEntryStatus>(entry?.status ?? "planned");
  const [values, setValues] = useState<Record<string, CustomFieldValue>>(() => getInitialValues(category, entry));
  const [photos, setPhotos] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<CustomEntryPhoto[]>(entry?.photos ?? []);
  const [error, setError] = useState("");
  const [duplicate, setDuplicate] = useState<CustomEntry | null>(null);
  const [isFetchingYouTubeTitle, setIsFetchingYouTubeTitle] = useState(false);
  const automaticTitleRef = useRef("");
  const automaticCoverRef = useRef(category.fields.reduce<string>((cover, field) => {
    if (cover || field.field_type !== "url") return cover;
    const value = entry?.values[field.id];
    const thumbnail = typeof value === "string" ? getYouTubeThumbnailUrl(value) : undefined;
    return thumbnail && thumbnail === entry?.cover_url ? thumbnail : "";
  }, ""));
  const requestedYouTubeUrlRef = useRef("");
  const dirty = useDraftSnapshot({ title, coverUrl, description, status, values, photos: photos.map((photo) => [photo.name, photo.size, photo.lastModified]) });
  const onClose = useUnsavedChanges(dirty, isSaving, discard);

  const youtubeUrl = category.fields.reduce<string>((found, field) => {
    if (found || field.field_type !== "url") return found;
    const value = values[field.id];
    return typeof value === "string" && getYouTubeVideoId(value) ? value.trim() : "";
  }, "");

  useEffect(() => {
    const canFillTitle = !title.trim() || title === automaticTitleRef.current;

    if (!isOpen || !youtubeUrl || !canFillTitle) {
      setIsFetchingYouTubeTitle(false);
      if (!youtubeUrl) requestedYouTubeUrlRef.current = "";
      return;
    }

    if (requestedYouTubeUrlRef.current === youtubeUrl) return;
    requestedYouTubeUrlRef.current = youtubeUrl;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setIsFetchingYouTubeTitle(true);
      void fetchYouTubeTitle(youtubeUrl, controller.signal)
        .then((nextTitle) => {
          if (!nextTitle) return;
          setTitle((current) => {
            if (current.trim() && current !== automaticTitleRef.current) return current;
            automaticTitleRef.current = nextTitle;
            return nextTitle;
          });
        })
        .catch(() => undefined)
        .finally(() => setIsFetchingYouTubeTitle(false));
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [isOpen, title, youtubeUrl]);

  if (!isOpen) return null;

  const isEditing = Boolean(entry);
  const planningFields = category.fields.filter((field) => field.phase === "planning");
  const primaryLinkFields = planningFields.filter((field) => field.field_type === "url");
  const remainingPlanningFields = planningFields.filter((field) => field.field_type !== "url");
  const completionFields = category.fields.filter((field) => field.phase === "completion");

  const getAutomaticCoverUrl = () => {
    const manualCover = getYouTubeThumbnailUrl(coverUrl) ?? coverUrl.trim();
    if (manualCover) return manualCover;

    for (const field of category.fields) {
      const value = values[field.id];
      const thumbnailUrl = field.field_type === "url" && typeof value === "string"
        ? getYouTubeThumbnailUrl(value)
        : undefined;

      if (thumbnailUrl) return thumbnailUrl;
    }

    return "";
  };

  const handleFieldChange = (field: CustomLibraryCategory["fields"][number], value: CustomFieldValue) => {
    setValues((current) => ({ ...current, [field.id]: value }));

    if (field.field_type !== "url" || typeof value !== "string") return;

    const thumbnailUrl = getYouTubeThumbnailUrl(value);
    if (thumbnailUrl) {
      setCoverUrl((current) => {
        if (current.trim() && current !== automaticCoverRef.current) return current;
        automaticCoverRef.current = thumbnailUrl;
        return thumbnailUrl;
      });
    }
  };

  const handleSubmit = async (allowDuplicate = false) => {
    if (!title.trim()) {
      setError(`Informe o nome do ${category.name_singular.toLowerCase()}.`);
      return;
    }

    const normalizedCoverUrl = getAutomaticCoverUrl();

    if (normalizedCoverUrl) {
      try {
        const parsedCoverUrl = new URL(normalizedCoverUrl);

        if (!['http:', 'https:'].includes(parsedCoverUrl.protocol)) throw new Error();
      } catch {
        setError("Informe um link de imagem válido, começando com http:// ou https://.");
        return;
      }
    }

    const activeFields = status === "completed" ? category.fields : planningFields;
    const missingRequiredField = activeFields.find((field) => {
      if (!field.required) return false;
      const value = values[field.id];
      return value === null || value === "" || (Array.isArray(value) && value.length === 0);
    });

    if (missingRequiredField) {
      setError(`Preencha o campo obrigatório “${missingRequiredField.label}”.`);
      return;
    }

    setError("");

    const match = findDuplicateEntry(entries, title, entry?.id);
    if (!allowDuplicate && match) { setDuplicate(match); return; }

    try {
      await onSave({
        title,
        cover_url: normalizedCoverUrl,
        description,
        status,
        values,
        completedAt: status === "completed" ? getCompletionDateValue(category, values) : undefined,
      }, photos);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar o item.");
    }
  };

  const removeExistingPhoto = async (photo: CustomEntryPhoto) => {
    if (!onDeletePhoto) return;

    try {
      await onDeletePhoto(photo);
      setExistingPhotos((current) => current.filter((item) => item.id !== photo.id));
      notify({ tone: "success", title: "Foto removida", message: "A foto foi removida da galeria." });
    } catch (photoError) {
      setError(photoError instanceof Error ? photoError.message : "Não foi possível remover a foto.");
      notify({ tone: "error", title: "Foto não removida", message: "Não foi possível remover a foto da galeria." });
    }
  };

  const inputClass = "h-11 w-full rounded-lg border border-white/10 bg-[#111114] px-3 text-sm text-white outline-none transition focus:border-noir-gold/70";
  const labelClass = "flex flex-col gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500";

  return (
    <div className={`fixed inset-0 z-[120] flex bg-black/80 backdrop-blur-sm ${isEditing ? "animate-dossier-overlay-in justify-end" : "items-center justify-center p-4"}`}>
      {duplicate && <DuplicateMediaDialog cover={duplicate.cover_url} title={duplicate.title} heading="Salvar mesmo assim?" description={<>Já existe <strong className="font-semibold text-white">{duplicate.title}</strong> nesta categoria. Confira se é o mesmo item antes de continuar.</>} confirmLabel="Salvar mesmo assim" isConfirming={isSaving} onCancel={() => !isSaving && setDuplicate(null)} onConfirm={() => { setDuplicate(null); void handleSubmit(true); }} />}
      {isEditing && <button type="button" aria-label="Fechar edição" className="absolute inset-0 cursor-default" onMouseDown={onClose} />}
      <section className={`relative z-10 flex w-full flex-col overflow-hidden border-white/10 bg-[#19191c] ${isEditing ? "animate-dossier-panel-in h-full max-w-[430px] border-l shadow-[-28px_0_80px_rgba(0,0,0,0.65)]" : "max-h-[92vh] max-w-3xl rounded-2xl border shadow-[0_30px_100px_rgba(0,0,0,0.8)]"}`}>
        <header className={`flex justify-between border-b border-white/10 px-7 ${isEditing ? "h-[70px] items-center" : "items-start py-6"}`}>
          <div className={isEditing ? "flex min-w-0 items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-noir-gold" : ""}>
            {isEditing ? (
              <>
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                <span>Dossiê</span>
                <span className="text-neutral-600">-</span>
                <span className="truncate">{category.name_singular}</span>
              </>
            ) : (
              <>
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-noir-gold">{category.name_plural}</span>
                <h2 className="mt-2 font-serif text-3xl font-bold italic text-noir-champagne">Adicionar {category.name_singular}</h2>
              </>
            )}
          </div>
          <button type="button" onClick={onClose} disabled={isSaving} className="rounded-full bg-white/5 p-2 text-neutral-500 hover:text-white"><X size={18} /></button>
        </header>

        <div className="overflow-y-auto px-7 py-6">
          {isEditing && (
            <div className="mb-7 border-b border-white/10 pb-5">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-noir-gold">Editar informações</p>
              <h2 className="mt-2 font-serif text-2xl font-extrabold text-white">{entry?.title}</h2>
            </div>
          )}
          <div className="grid gap-5 md:grid-cols-2">
            <label className={labelClass}>
              Nome *
              <input autoFocus className={inputClass} value={title} onChange={(event) => { automaticTitleRef.current = ""; setTitle(event.target.value); }} />
              {isFetchingYouTubeTitle && <span className="text-[9px] font-normal normal-case tracking-normal text-noir-gold">Buscando título do YouTube...</span>}
            </label>
            <label className={labelClass}>
              Estado
              <select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value as CustomEntryStatus)}>
                <option value="planned">{category.planned_label}</option>
                <option value="completed">{category.completed_label}</option>
              </select>
            </label>
          </div>

          {primaryLinkFields.length > 0 && (
            <div className="mt-5 grid gap-4">
              {primaryLinkFields.map((field) => <CustomFieldInput key={field.id} field={field} value={values[field.id]} onChange={(value) => handleFieldChange(field, value)} />)}
            </div>
          )}

          <label className={`${labelClass} mt-5`}>
            Imagem de capa
            <input type="url" className={inputClass} value={coverUrl} onChange={(event) => { const automaticCover = getYouTubeThumbnailUrl(event.target.value); automaticCoverRef.current = automaticCover ?? ""; setCoverUrl(automaticCover ?? event.target.value); }} placeholder="https://..." />
            <span className="text-[9px] font-normal normal-case tracking-normal text-neutral-600">Usada no card e no topo do dossiê.</span>
          </label>

          <label className={`${labelClass} mt-5`}>
            Observações
            <textarea className="min-h-24 rounded-lg border border-white/10 bg-[#111114] p-3 text-sm normal-case tracking-normal text-white outline-none focus:border-noir-gold/70" value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>

          {remainingPlanningFields.length > 0 && (
            <section className="mt-7">
              <h3 className="mb-4 border-b border-white/10 pb-3 font-serif text-lg font-bold text-white">Planejamento</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {remainingPlanningFields.map((field) => <CustomFieldInput key={field.id} field={field} value={values[field.id]} onChange={(value) => handleFieldChange(field, value)} />)}
              </div>
            </section>
          )}

          {status === "completed" && completionFields.length > 0 && (
            <section className="mt-7">
              <h3 className="mb-4 border-b border-white/10 pb-3 font-serif text-lg font-bold text-white">Depois de concluir</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {completionFields.map((field) => <CustomFieldInput key={field.id} field={field} value={values[field.id]} onChange={(value) => handleFieldChange(field, value)} />)}
              </div>
            </section>
          )}

          <section className="mt-7">
            <h3 className="mb-4 border-b border-white/10 pb-3 font-serif text-lg font-bold text-white">Fotos</h3>
            {(existingPhotos.length > 0 || photos.length > 0) && (
              <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
                {existingPhotos.map((photo) => (
                  <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg bg-black/20">
                    {photo.signed_url && <img src={photo.signed_url} alt="" className="h-full w-full object-cover" />}
                    {onDeletePhoto && (
                      <button type="button" onClick={() => void removeExistingPhoto(photo)} className="absolute right-1 top-1 rounded bg-black/75 p-1.5 text-white opacity-0 transition group-hover:opacity-100"><Trash2 size={13} /></button>
                    )}
                  </div>
                ))}
                {photos.map((photo, index) => (
                  <div key={`${photo.name}-${index}`} className="relative flex aspect-square items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] p-2 text-center text-[9px] text-neutral-500">
                    <span className="line-clamp-3">{photo.name}</span>
                    <button type="button" onClick={() => setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="absolute right-1 top-1 rounded bg-black/75 p-1.5 text-white"><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}
            <label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-5 py-6 text-sm text-neutral-500 transition hover:border-noir-gold/35 hover:text-noir-champagne">
              <ImagePlus size={20} />
              Adicionar uma ou várias fotos
              <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="hidden" onChange={(event) => setPhotos((current) => [...current, ...Array.from(event.target.files ?? [])])} />
            </label>
            <p className="mt-2 text-[10px] text-neutral-600">JPEG, PNG, WebP ou AVIF. Até 10 MB por foto.</p>
          </section>

          {error && <p role="alert" className="mt-5 rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
        </div>

        <footer className="flex items-center gap-3 border-t border-white/10 px-7 py-5">
          <button type="button" onClick={onClose} disabled={isSaving} className="flex h-11 flex-1 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-4 font-mono text-xs font-bold uppercase tracking-wide text-neutral-300 transition-colors hover:bg-white/[0.06] disabled:opacity-50">Cancelar</button>
          <button type="button" onClick={() => void handleSubmit()} disabled={isSaving} className="flex h-11 flex-1 items-center justify-center rounded-lg bg-noir-gold px-4 font-mono text-xs font-bold uppercase tracking-wide text-black transition-colors hover:bg-noir-champagne disabled:opacity-50">
            {isSaving ? "Salvando..." : "Salvar"}
          </button>
        </footer>
      </section>
    </div>
  );
}

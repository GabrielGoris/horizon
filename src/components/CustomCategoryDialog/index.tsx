import { Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { CUSTOM_CATEGORY_ICONS } from "../CustomCategoryIcon/consts";
import type {
  CustomCategoryField,
  CustomCategoryInput,
  CustomFieldPhase,
  CustomFieldType,
  CustomLibraryCategory,
} from "../../types/customLibrary";

const FIELD_TYPES: Array<{ value: CustomFieldType; label: string }> = [
  { value: "text", label: "Texto curto" },
  { value: "textarea", label: "Texto longo" },
  { value: "number", label: "Número" },
  { value: "currency", label: "Preço" },
  { value: "date", label: "Data" },
  { value: "url", label: "Link" },
  { value: "boolean", label: "Sim ou não" },
  { value: "select", label: "Escolha única" },
  { value: "multiselect", label: "Múltiplas escolhas" },
];

type DraftField = Pick<CustomCategoryField, "id" | "label" | "field_type" | "phase" | "required" | "options">;

interface CustomCategoryDialogProps {
  category?: CustomLibraryCategory | null;
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onDelete?: (category: CustomLibraryCategory) => Promise<void>;
  onSave: (input: CustomCategoryInput) => Promise<void>;
}

function getInitialFields(category?: CustomLibraryCategory | null): DraftField[] {
  return category?.fields.map(({ id, label, field_type, phase, required, options }) => ({
    id,
    label,
    field_type,
    phase,
    required,
    options,
  })) ?? [];
}

export function CustomCategoryDialog({
  category,
  isOpen,
  isSaving,
  onClose,
  onDelete,
  onSave,
}: CustomCategoryDialogProps) {
  const [nameSingular, setNameSingular] = useState(category?.name_singular ?? "");
  const [namePlural, setNamePlural] = useState(category?.name_plural ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [icon, setIcon] = useState(category?.icon ?? "folder");
  const [accentColor, setAccentColor] = useState(category?.accent_color ?? "#d4af37");
  const [plannedLabel, setPlannedLabel] = useState(category?.planned_label ?? "Planejado");
  const [completedLabel, setCompletedLabel] = useState(category?.completed_label ?? "Concluído");
  const [fields, setFields] = useState<DraftField[]>(() => getInitialFields(category));
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const addField = () => {
    setFields((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        label: "",
        field_type: "text",
        phase: "planning",
        required: false,
        options: [],
      },
    ]);
  };

  const updateField = (id: string, patch: Partial<DraftField>) => {
    setFields((current) => current.map((field) => field.id === id ? { ...field, ...patch } : field));
  };

  const handleSubmit = async () => {
    const validFields = fields.filter((field) => field.label.trim());

    if (!nameSingular.trim() || !namePlural.trim()) {
      setError("Informe os nomes singular e plural da categoria.");
      return;
    }

    if (!plannedLabel.trim() || !completedLabel.trim()) {
      setError("Informe os nomes dos dois estados da categoria.");
      return;
    }

    if (!/^#[0-9a-f]{6}$/i.test(accentColor)) {
      setError("Use uma cor hexadecimal válida, como #d4af37.");
      return;
    }

    setError("");

    try {
      await onSave({
        name_singular: nameSingular,
        name_plural: namePlural,
        description,
        icon,
        accent_color: accentColor,
        planned_label: plannedLabel,
        completed_label: completedLabel,
        fields: validFields,
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar a categoria.");
    }
  };

  const inputClass = "h-11 w-full rounded-lg border border-white/10 bg-[#111114] px-3 text-sm text-white outline-none transition focus:border-noir-gold/70";
  const labelClass = "flex flex-col gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <section className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#19191c] shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
        <header className="flex items-start justify-between border-b border-white/10 px-7 py-6">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-noir-gold">Biblioteca personalizada</span>
            <h2 className="mt-2 font-serif text-3xl font-bold italic text-noir-champagne">
              {category ? "Editar categoria" : "Nova categoria"}
            </h2>
          </div>
          <button type="button" onClick={onClose} disabled={isSaving} className="rounded-full bg-white/5 p-2 text-neutral-500 hover:text-white">
            <X size={18} />
          </button>
        </header>

        <div className="overflow-y-auto px-7 py-6">
          <div className="grid gap-5 md:grid-cols-2">
            <label className={labelClass}>
              Nome no singular
              <input className={inputClass} value={nameSingular} onChange={(event) => setNameSingular(event.target.value)} placeholder="Ex.: Restaurante" />
            </label>
            <label className={labelClass}>
              Nome no plural
              <input className={inputClass} value={namePlural} onChange={(event) => setNamePlural(event.target.value)} placeholder="Ex.: Restaurantes" />
            </label>
            <label className={labelClass}>
              Estado inicial
              <input className={inputClass} value={plannedLabel} onChange={(event) => setPlannedLabel(event.target.value)} placeholder="Ex.: Quero visitar" />
            </label>
            <label className={labelClass}>
              Estado concluído
              <input className={inputClass} value={completedLabel} onChange={(event) => setCompletedLabel(event.target.value)} placeholder="Ex.: Já visitei" />
            </label>
            <label className={labelClass}>
              Ícone
              <select className={inputClass} value={icon} onChange={(event) => setIcon(event.target.value)}>
                {CUSTOM_CATEGORY_ICONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className={labelClass}>
              Cor de destaque
              <span className="flex h-11 overflow-hidden rounded-lg border border-white/10 bg-[#111114]">
                <input type="color" className="h-full w-14 cursor-pointer border-0 bg-transparent p-1" value={accentColor} onChange={(event) => setAccentColor(event.target.value)} />
                <input className="min-w-0 flex-1 bg-transparent px-3 text-sm uppercase text-white outline-none" value={accentColor} onChange={(event) => setAccentColor(event.target.value)} pattern="^#[0-9A-Fa-f]{6}$" />
              </span>
            </label>
          </div>

          <label className={`${labelClass} mt-5`}>
            Descrição
            <textarea className="min-h-24 rounded-lg border border-white/10 bg-[#111114] p-3 text-sm normal-case tracking-normal text-white outline-none focus:border-noir-gold/70" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="O que você quer guardar nesta categoria?" />
          </label>

          <div className="mt-8 flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-white">Campos personalizados</h3>
              <p className="mt-1 text-xs text-neutral-500">Campos de planejamento aparecem antes; os de conclusão registram a experiência depois.</p>
            </div>
            <button type="button" onClick={addField} className="flex items-center gap-2 rounded-lg border border-noir-gold/25 bg-noir-gold/10 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-widest text-noir-gold hover:bg-noir-gold/15">
              <Plus size={14} /> Campo
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {fields.length === 0 && (
              <div className="rounded-xl border border-dashed border-white/10 px-5 py-8 text-center text-sm text-neutral-600">
                A categoria pode começar sem campos. Você poderá adicioná-los depois.
              </div>
            )}
            {fields.map((field, index) => (
              <div key={field.id} className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 md:grid-cols-[1.4fr_1fr_1fr_auto]">
                <label className={labelClass}>
                  Nome do campo
                  <input className={inputClass} value={field.label} onChange={(event) => updateField(field.id, { label: event.target.value })} placeholder={index === 0 ? "Ex.: Média de preço" : "Nome do campo"} />
                </label>
                <label className={labelClass}>
                  Tipo
                  <select className={inputClass} value={field.field_type} onChange={(event) => updateField(field.id, { field_type: event.target.value as CustomFieldType })}>
                    {FIELD_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                </label>
                <label className={labelClass}>
                  Momento
                  <select className={inputClass} value={field.phase} onChange={(event) => updateField(field.id, { phase: event.target.value as CustomFieldPhase })}>
                    <option value="planning">Planejamento</option>
                    <option value="completion">Conclusão</option>
                  </select>
                </label>
                <button type="button" aria-label="Remover campo" onClick={() => setFields((current) => current.filter((item) => item.id !== field.id))} className="mt-5 flex h-10 w-10 items-center justify-center rounded-lg text-neutral-600 hover:bg-red-500/10 hover:text-red-300">
                  <Trash2 size={16} />
                </button>

                {(field.field_type === "select" || field.field_type === "multiselect") && (
                  <label className={`${labelClass} md:col-span-3`}>
                    Opções separadas por vírgula
                    <input className={inputClass} value={field.options.join(", ")} onChange={(event) => updateField(field.id, { options: event.target.value.split(",").map((option) => option.trim()).filter(Boolean) })} placeholder="Ex.: Barato, Médio, Caro" />
                  </label>
                )}
                <label className="flex items-center gap-2 self-end pb-3 text-xs text-neutral-400">
                  <input type="checkbox" checked={field.required} onChange={(event) => updateField(field.id, { required: event.target.checked })} className="accent-[#d4af37]" />
                  Obrigatório
                </label>
              </div>
            ))}
          </div>

          {error && <p role="alert" className="mt-5 rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
        </div>

        <footer className="flex items-center gap-3 border-t border-white/10 px-7 py-5">
          {category && onDelete && (
            <button type="button" disabled={isSaving} onClick={() => void onDelete(category)} className="mr-auto flex items-center gap-2 rounded-lg border border-red-400/20 px-4 py-2.5 font-mono text-[10px] font-bold uppercase text-red-300 hover:bg-red-500/10 disabled:opacity-50">
              <Trash2 size={14} /> Excluir categoria
            </button>
          )}
          <button type="button" onClick={onClose} disabled={isSaving} className="rounded-lg border border-white/10 px-5 py-2.5 text-xs font-bold text-neutral-400 hover:text-white disabled:opacity-50">Cancelar</button>
          <button type="button" onClick={() => void handleSubmit()} disabled={isSaving} className="rounded-lg bg-noir-gold px-6 py-2.5 text-xs font-black uppercase text-black hover:bg-noir-champagne disabled:opacity-50">
            {isSaving ? "Salvando..." : "Salvar categoria"}
          </button>
        </footer>
      </section>
    </div>
  );
}

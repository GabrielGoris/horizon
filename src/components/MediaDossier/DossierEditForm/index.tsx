import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import {
  updateMediaDetailsSchema,
  type UpdateMediaDetailsDTO,
} from "../../../schemas/media";
import type { MediaItem } from "../../../types";

type DossierEditFormProps = {
  item: MediaItem;
  onCancel: () => void;
  onSave: (details: UpdateMediaDetailsDTO) => void | Promise<void>;
};

function getDefaultValues(item: MediaItem): UpdateMediaDetailsDTO {
  return {
    title: item.title,
    creator: item.creator,
    director: item.director ?? "",
    category: item.category,
    cover: item.cover,
    backdrop: item.backdrop ?? "",
    release_year: item.releaseYear,
    campaign_hours: String(item.campaign_hours ?? ""),
    description: item.description,
  };
}

export function DossierEditForm({ item, onCancel, onSave }: DossierEditFormProps) {
  const [saveError, setSaveError] = useState("");
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<UpdateMediaDetailsDTO>({
    defaultValues: getDefaultValues(item),
    resolver: zodResolver(updateMediaDetailsSchema),
  });
  const submit = handleSubmit(async (details) => {
    setSaveError("");

    try {
      await onSave(details);
    } catch (error) {
      console.error(error);
      setSaveError("Não foi possível salvar as alterações.");
    }
  });

  return (
    <form className="contents" onSubmit={submit}>
      <div className="animate-dossier-content-in flex-1 overflow-y-auto px-7 py-7">
        <div className="mb-7 border-b border-white/10 pb-5">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-noir-gold">
            Editar informações
          </p>
          <h2 className="mt-2 font-serif text-2xl font-extrabold text-white">{item.title}</h2>
        </div>

        <div className="flex flex-col gap-5">
          <EditField error={errors.title?.message} label="Título">
            <input {...register("title")} className="dossier-edit-input" />
          </EditField>

          <div className="grid grid-cols-2 gap-4">
            <EditField label={item.type === "books" ? "Autor" : item.type === "games" ? "Estúdio" : "Criador"}>
              <input {...register("creator")} className="dossier-edit-input" />
            </EditField>
            {(item.type === "movies" || item.type === "animes") ? (
              <EditField label="Diretor">
                <input {...register("director")} className="dossier-edit-input" />
              </EditField>
            ) : (
              <EditField label="Ano">
                <input {...register("release_year")} className="dossier-edit-input" />
              </EditField>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <EditField label="Gêneros">
              <input {...register("category")} className="dossier-edit-input" />
            </EditField>
            {item.type === "games" ? (
              <EditField label="Tempo de campanha">
                <input
                  {...register("campaign_hours")}
                  placeholder="Ex: 8h 30 min"
                  className="dossier-edit-input"
                />
              </EditField>
            ) : (
              <EditField label="Ano">
                <input {...register("release_year")} className="dossier-edit-input" />
              </EditField>
            )}
          </div>

          <EditField error={errors.cover?.message} label="Capa">
            <input
              {...register("cover")}
              type="url"
              placeholder="https://..."
              className="dossier-edit-input"
            />
          </EditField>

          <EditField error={errors.backdrop?.message} label="Imagem de fundo">
            <input
              {...register("backdrop")}
              type="url"
              placeholder="https://..."
              className="dossier-edit-input"
            />
          </EditField>

          <EditField label="Resumo / Arquivo">
            <textarea
              {...register("description")}
              rows={6}
              className="dossier-edit-input resize-none leading-6"
            />
          </EditField>

          {saveError && (
            <p role="alert" className="rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {saveError}
            </p>
          )}
        </div>
      </div>

      <footer className="flex items-center gap-3 border-t border-white/10 p-5">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex h-11 flex-1 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-4 font-mono text-xs font-bold uppercase tracking-wide text-neutral-300 transition-colors hover:bg-white/[0.06] disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-noir-gold px-4 font-mono text-xs font-bold uppercase tracking-wide text-black transition-colors hover:bg-noir-champagne disabled:opacity-50"
        >
          {isSubmitting ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
          Salvar
        </button>
      </footer>
    </form>
  );
}

function EditField({
  children,
  error,
  label,
}: {
  children: ReactNode;
  error?: string;
  label: string;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-2">
      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </span>
      {children}
      {error && <span className="text-[10px] text-red-400">{error}</span>}
    </label>
  );
}

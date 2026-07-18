import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import type { CustomEntryPhoto } from "../../../types/customLibrary";

interface GalleryProps {
  photos: CustomEntryPhoto[];
  isSaving: boolean;
  onAdd: (files: File[]) => void;
  onDelete: (photo: CustomEntryPhoto) => void;
  onExpand: (url: string) => void;
}

export function Gallery({ isSaving, onAdd, onDelete, onExpand, photos }: GalleryProps) {
  return (
    <section className="mx-auto mt-5 w-full max-w-[360px] border-t border-white/10 pt-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-neutral-600">Galeria</p>
        <span className="font-mono text-[9px] text-neutral-600">
          {photos.length} {photos.length === 1 ? "foto" : "fotos"}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {photos.map((photo) => (
          <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-md bg-black/20">
            <button
              type="button"
              onClick={() => photo.signed_url && onExpand(photo.signed_url)}
              className="h-full w-full cursor-zoom-in"
            >
              {photo.signed_url && (
                <img
                  src={photo.signed_url}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              )}
            </button>
            <button
              type="button"
              disabled={isSaving}
              aria-label="Remover foto"
              onClick={() => onDelete(photo)}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded bg-black/75 text-red-300 opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-40"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}

        <label
          className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-white/15 text-neutral-600 transition hover:border-noir-gold/35 hover:text-noir-gold"
          title="Adicionar fotos"
        >
          {isSaving ? <LoaderCircle size={16} className="animate-spin" /> : <ImagePlus size={17} />}
          <span className="font-mono text-[7px] font-bold uppercase tracking-wider">Adicionar</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            disabled={isSaving}
            className="hidden"
            onChange={(event) => onAdd(Array.from(event.target.files ?? []))}
          />
        </label>
      </div>
    </section>
  );
}

import { useState } from "react";
import { X } from "lucide-react";
import { buildWishlistPreview, getWishlistItems, WISHLIST_LIMIT } from "../../services/wishlistService";
import type { MediaCoverProps, WishlistPriorityDialogProps } from "./types";


const positions = Array.from({ length: WISHLIST_LIMIT }, (_, index) => index + 1);

function MediaCover({ item, className }: MediaCoverProps) {
  const cover = item.cover?.trim();

  if (!cover) {
    return (
      <div className={`${className} flex items-center justify-center bg-white/[0.04] px-3 text-center font-mono text-[9px] uppercase tracking-widest text-neutral-600`}>
        Sem capa
      </div>
    );
  }

  return (
    <img
      src={cover}
      alt={item.title}
      className={`${className} object-cover`}
      onError={(event) => {
        event.currentTarget.remove();
      }}
    />
  );
}

export function WishlistPriorityDialog({
  collection,
  item,
  isSaving = false,
  onCancel,
  onConfirm,
}: WishlistPriorityDialogProps) {
  const [selectedPosition, setSelectedPosition] = useState(() => {
    const currentPosition = Number(item.wishlist_position);

    if (Number.isFinite(currentPosition) && currentPosition > 0) return currentPosition;

    return Math.min(getWishlistItems(collection, item.type).length + 1, WISHLIST_LIMIT);
  });
  const preview = buildWishlistPreview(collection, item, selectedPosition);
  const previewPosition = preview.targetPosition;

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/75 px-5 backdrop-blur-[6px]">
      <button
        type="button"
        aria-label="Cancelar prioridade"
        className="absolute inset-0 cursor-default"
        onClick={onCancel}
      />

      <section className="relative z-10 flex max-h-[90vh] w-full max-w-[920px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1a1a1e] shadow-[0_28px_90px_rgba(0,0,0,0.72)]">
        <header className="flex items-start justify-between gap-5 border-b border-white/10 px-6 py-5">
          <div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-noir-gold">
              Lista de prioridade
            </p>
            <h2 className="mt-1 font-serif text-2xl font-extrabold text-white">
              Posicionar na wishlist
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-400">
              Escolha onde esta obra entra. Os itens abaixo descem uma posição.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Fechar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-neutral-400 transition-colors hover:border-white/20 hover:text-white"
          >
            <X size={18} />
          </button>
        </header>

        <div className="overflow-y-auto px-6 py-6">
          <div className="mb-6 grid gap-5 rounded-2xl border border-noir-gold/20 bg-noir-gold/10 p-5 md:grid-cols-[140px_1fr]">
            <div className="aspect-[2/3] overflow-hidden rounded-xl border border-noir-gold/25 bg-black/20 shadow-2xl shadow-black/30">
              <MediaCover item={item} className="h-full w-full" />
            </div>

            <div className="flex min-w-0 flex-col justify-center">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-noir-gold">
                Nova prioridade
              </p>
              <h3 className="mt-3 truncate font-serif text-3xl font-extrabold text-white">
                {item.title}
              </h3>
              <p className="mt-2 truncate font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                {item.creator || "Criador nao informado"}
              </p>
              <p className="mt-5 max-w-xl text-sm leading-6 text-neutral-400">
                Clique em uma posição para visualizar a nova ordem da lista.
              </p>
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-3">
            {positions.map((position) => {
              const slotItem = preview.items[position - 1];
              const isNewItem = slotItem?.id === item.id;

              return (
                <button
                  key={position}
                  type="button"
                  onClick={() => setSelectedPosition(position)}
                  disabled={isSaving}
                  className={`group flex w-[132px] shrink-0 flex-col rounded-xl border p-2 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                    isNewItem
                      ? "border-noir-gold/55 bg-noir-gold/15 shadow-[0_18px_40px_rgba(212,175,55,0.12)]"
                      : "border-white/10 bg-white/[0.03] hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.055]"
                  }`}
                >
                  <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-white/10 bg-black/20">
                    <span className="absolute left-2 top-2 z-10 rounded bg-black/75 px-2 py-1 font-mono text-[10px] font-black text-noir-gold">
                      #{position}
                    </span>

                    {slotItem ? (
                      <MediaCover item={slotItem} className="h-full w-full" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center px-3 text-center font-mono text-[9px] uppercase tracking-widest text-neutral-600">
                        Vazio
                      </div>
                    )}

                    {isNewItem && (
                      <div className="pointer-events-none absolute inset-0 border-2 border-noir-gold/70 bg-noir-gold/10" />
                    )}
                  </div>

                  {slotItem ? (
                    <div className="mt-3 min-w-0">
                      <strong className="block truncate text-sm text-white">
                        {slotItem.title}
                      </strong>
                      <span className="mt-1 block truncate font-mono text-[9px] uppercase tracking-wider text-neutral-500">
                        {isNewItem ? "Nova posição" : slotItem.creator || "Criador nao informado"}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-3 min-w-0">
                      <strong className="block text-sm text-neutral-500">
                        Posição vazia
                      </strong>
                      <span className="mt-1 block font-mono text-[9px] uppercase tracking-wider text-neutral-700">
                        Inserir aqui
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {preview.removedItem && (
            <p className="mt-4 rounded-lg border border-red-400/15 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-200">
              {preview.removedItem.title} sairá da lista de prioridade ao confirmar.
            </p>
          )}
        </div>

        <footer className="flex items-center justify-end gap-3 border-t border-white/10 bg-black/10 p-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="px-5 py-3 font-mono text-xs font-bold uppercase tracking-wide text-neutral-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(previewPosition)}
            disabled={isSaving}
            className="rounded-lg bg-[#d4af37] px-6 py-3 font-mono text-xs font-bold uppercase tracking-wide text-black shadow-lg shadow-[#d4af37]/20 transition-all hover:-translate-y-0.5 hover:bg-[#ebdcb9] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {isSaving ? "Salvando..." : "Confirmar posição"}
          </button>
        </footer>
      </section>
    </div>
  );
}

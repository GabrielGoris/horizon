import { useState } from "react";
import { X } from "lucide-react";
import { PriorityList } from "../PriorityList";
import { buildWishlistPreview, getWishlistItems, WISHLIST_LIMIT } from "../../services/wishlistService";
import type { WishlistPriorityDialogProps } from "./types";

function DialogItemCover({ cover, title }: { cover?: string; title: string }) {
  const imageUrl = cover?.trim();

  if (!imageUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white/[0.04] px-3 text-center font-mono text-[9px] uppercase tracking-widest text-neutral-600">
        Sem capa
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={title}
      className="h-full w-full object-cover"
      onError={(event) => {
        event.currentTarget.remove();
      }}
    />
  );
}

export function WishlistPriorityDialog({
  collection,
  item,
  mediaType,
  isSaving = false,
  onCancel,
  onConfirm,
  onMoveItem,
  onRemoveItem,
}: WishlistPriorityDialogProps) {
  const targetMediaType = item?.type ?? mediaType;
  const isManagingList = !item && Boolean(targetMediaType);
  const [selectedPosition, setSelectedPosition] = useState(() => {
    if (!item) return 1;

    const currentPosition = Number(item.wishlist_position);

    if (Number.isFinite(currentPosition) && currentPosition > 0) return currentPosition;

    return Math.min(getWishlistItems(collection, item.type).length + 1, WISHLIST_LIMIT);
  });
  const wishlistItems = targetMediaType ? getWishlistItems(collection, targetMediaType) : [];
  const preview = item ? buildWishlistPreview(collection, item, selectedPosition) : null;
  const previewItems = preview?.items ?? wishlistItems;
  const previewPosition = preview?.targetPosition ?? selectedPosition;

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
              {isManagingList ? "Gerenciar wishlist" : "Posicionar na wishlist"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-400">
              {isManagingList
                ? "Arraste os itens para reorganizar ou remova obras da lista."
                : "Arraste a obra para uma posição ou clique em um espaço para visualizar a nova ordem."}
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
          {item && (
            <div className="mb-6 grid gap-5 rounded-2xl border border-noir-gold/20 bg-noir-gold/10 p-5 md:grid-cols-[140px_1fr]">
              <div className="aspect-[2/3] overflow-hidden rounded-xl border border-noir-gold/25 bg-black/20 shadow-2xl shadow-black/30">
                <DialogItemCover cover={item.cover} title={item.title} />
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
              </div>
            </div>
          )}

          <PriorityList
            items={previewItems}
            pendingItem={item}
            isManagingList={isManagingList}
            isSaving={isSaving}
            onPositionPreview={setSelectedPosition}
            onMoveItem={onMoveItem}
            onRemoveItem={onRemoveItem}
          />

          {preview?.removedItem && (
            <p className="mt-4 rounded-lg border border-red-400/15 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-200">
              {preview.removedItem.title} saira da lista de prioridade ao confirmar.
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
            onClick={() => {
              if (item) {
                void onConfirm?.(previewPosition);
                return;
              }

              onCancel();
            }}
            disabled={isSaving || (Boolean(item) && !onConfirm)}
            className="rounded-lg bg-[#d4af37] px-6 py-3 font-mono text-xs font-bold uppercase tracking-wide text-black shadow-lg shadow-[#d4af37]/20 transition-all hover:-translate-y-0.5 hover:bg-[#ebdcb9] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {isSaving ? "Salvando..." : item ? "Confirmar posição" : "Fechar"}
          </button>
        </footer>
      </section>
    </div>
  );
}

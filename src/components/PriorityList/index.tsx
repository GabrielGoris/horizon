import { useState } from "react";
import { GripVertical, Trash2 } from "lucide-react";
import { WISHLIST_LIMIT } from "../../services/wishlistService";
import type { MediaItem } from "../../types";
import type { PriorityCoverProps, PriorityListProps } from "./types";

const positions = Array.from({ length: WISHLIST_LIMIT }, (_, index) => index + 1);

function PriorityCover({ item, className }: PriorityCoverProps) {
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

export function PriorityList({
  items,
  pendingItem,
  isManagingList,
  isSaving = false,
  onPositionPreview,
  onMoveItem,
  onRemoveItem,
}: PriorityListProps) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const draggedItem = draggedItemId ? items.find((wishlistItem) => wishlistItem.id === draggedItemId) : null;

  function handleDrop(position: number) {
    if (isSaving || !draggedItem) return;

    setDraggedItemId(null);

    if (isManagingList) {
      void onMoveItem?.(draggedItem, position);
      return;
    }

    if (pendingItem?.id === draggedItem.id) {
      onPositionPreview?.(position);
    }
  }

  function canDragItem(slotItem?: MediaItem) {
    if (!slotItem || isSaving) return false;

    return isManagingList || pendingItem?.id === slotItem.id;
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-3">
      {positions.map((position) => {
        const slotItem = items[position - 1];
        const isNewItem = Boolean(pendingItem && slotItem?.id === pendingItem.id);
        const isDragging = Boolean(slotItem && draggedItemId === slotItem.id);
        const canReceiveDrop = Boolean(draggedItem && (!isManagingList ? pendingItem?.id === draggedItem.id : true));

        return (
          <div
            key={position}
            onClick={() => {
              if (pendingItem) {
                onPositionPreview?.(position);
              }
            }}
            onDragOver={(event) => {
              if (!canReceiveDrop) return;

              event.preventDefault();
            }}
            onDrop={(event) => {
              event.preventDefault();
              handleDrop(position);
            }}
            className={`group flex w-[132px] shrink-0 flex-col rounded-xl border p-2 text-left transition-all ${
              isSaving ? "cursor-not-allowed opacity-60" : pendingItem ? "cursor-pointer" : ""
            } ${
              isNewItem
                ? "border-noir-gold/55 bg-noir-gold/15 shadow-[0_18px_40px_rgba(212,175,55,0.12)]"
                : canReceiveDrop && draggedItem?.id !== slotItem?.id
                  ? "border-noir-gold/35 bg-noir-gold/10"
                  : "border-white/10 bg-white/[0.03] hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.055]"
            } ${
              isDragging ? "scale-[0.98] opacity-45" : ""
            }`}
          >
            <div
              draggable={canDragItem(slotItem)}
              onDragStart={(event) => {
                if (!slotItem || !canDragItem(slotItem)) return;

                setDraggedItemId(slotItem.id);
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", slotItem.id);
              }}
              onDragEnd={() => setDraggedItemId(null)}
              className={`relative aspect-[2/3] overflow-hidden rounded-lg border border-white/10 bg-black/20 ${
                canDragItem(slotItem) ? "cursor-grab active:cursor-grabbing" : ""
              }`}
            >
              <span className="absolute left-2 top-2 z-10 rounded bg-black/75 px-2 py-1 font-mono text-[10px] font-black text-noir-gold">
                #{position}
              </span>
              {canDragItem(slotItem) && (
                <span className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded bg-black/75 text-neutral-300 opacity-0 transition-opacity group-hover:opacity-100">
                  <GripVertical size={14} />
                </span>
              )}

              {slotItem ? (
                <PriorityCover item={slotItem} className="h-full w-full" />
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
                  {isNewItem ? "Nova posicao" : slotItem.creator || "Criador nao informado"}
                </span>

                {isManagingList && (
                  <div className="mt-3 flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Remover da lista"
                      disabled={isSaving}
                      onClick={(event) => {
                        event.stopPropagation();
                        void onRemoveItem?.(slotItem);
                      }}
                      className="ml-auto flex h-7 w-7 items-center justify-center rounded border border-red-400/20 bg-red-500/10 text-red-300 transition-colors hover:border-red-300/40 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
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
          </div>
        );
      })}
    </div>
  );
}

import { useState } from 'react'
import { GripVertical, Trash2 } from 'lucide-react'
import { WISHLIST_LIMIT } from '../../services/wishlistService'
import type { MediaItem } from '../../types'
import type { PriorityCoverProps, PriorityListProps } from './types'

const allPositions = Array.from({ length: WISHLIST_LIMIT }, (_, index) => index + 1)

function PriorityCover({ item, className }: PriorityCoverProps) {
  const cover = item.cover?.trim()
  if (!cover) return <div className={`${className} flex items-center justify-center bg-white/[0.04] px-3 text-center font-mono text-[9px] uppercase tracking-widest text-neutral-600`}>Sem capa</div>

  return <img src={cover} alt={item.title} className={`${className} object-cover`} onError={(event) => event.currentTarget.remove()} />
}

export function PriorityList({ items, pendingItem, isManagingList, isSaving = false, onPositionPreview, onMoveItem, onRemoveItem }: PriorityListProps) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [dragOverPosition, setDragOverPosition] = useState<number | null>(null)
  const positions = isManagingList ? allPositions.slice(0, Math.max(items.length, 1)) : allPositions
  const draggedItem = draggedItemId ? items.find((item) => item.id === draggedItemId) : null

  function canDragItem(item?: MediaItem) {
    return Boolean(item) && !isSaving && (isManagingList || pendingItem?.id === item?.id)
  }

  function getPositionAtPoint(clientX: number, clientY: number) {
    const element = document.elementFromPoint(clientX, clientY)
    const slot = element?.closest<HTMLElement>('[data-priority-slot]')
    const value = Number(slot?.dataset.prioritySlot)
    return Number.isFinite(value) ? value : null
  }

  function finishDrag(item: MediaItem, fallbackPosition: number) {
    const targetPosition = dragOverPosition ?? fallbackPosition
    setDraggedItemId(null)
    setDragOverPosition(null)

    if (isManagingList) {
      void onMoveItem?.(item, targetPosition)
    } else if (pendingItem?.id === item.id) {
      onPositionPreview?.(targetPosition)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:flex md:gap-4 md:overflow-x-auto md:pb-3">
      {positions.map((position) => {
        const slotItem = items[position - 1]
        const isNewItem = Boolean(pendingItem && slotItem?.id === pendingItem.id)
        const isDragging = slotItem?.id === draggedItemId
        const isDropTarget = Boolean(draggedItem && dragOverPosition === position && draggedItem.id !== slotItem?.id)

        return (
          <div
            key={position}
            data-priority-slot={position}
            onClick={() => pendingItem && onPositionPreview?.(position)}
            className={`group flex min-h-[130px] w-full rounded-xl border p-2 text-left transition-all md:min-h-0 md:w-[132px] md:shrink-0 md:flex-col ${isSaving ? 'cursor-not-allowed opacity-60' : pendingItem ? 'cursor-pointer' : ''} ${isNewItem ? 'border-noir-gold/55 bg-noir-gold/15 shadow-[0_18px_40px_rgba(212,175,55,0.12)]' : isDropTarget ? 'border-noir-gold bg-noir-gold/15 shadow-[0_0_0_2px_rgba(212,175,55,0.16)]' : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.055]'} ${isDragging ? 'scale-[0.98] opacity-45' : ''}`}
          >
            <div
              onPointerDown={(event) => {
                if (!slotItem || !canDragItem(slotItem)) return
                event.currentTarget.setPointerCapture(event.pointerId)
                setDraggedItemId(slotItem.id)
                setDragOverPosition(position)
              }}
              onPointerMove={(event) => {
                if (!draggedItemId) return
                const target = getPositionAtPoint(event.clientX, event.clientY)
                if (target) setDragOverPosition(target)
              }}
              onPointerUp={() => {
                if (slotItem && draggedItemId === slotItem.id) finishDrag(slotItem, position)
              }}
              onPointerCancel={() => {
                setDraggedItemId(null)
                setDragOverPosition(null)
              }}
              className={`relative h-[112px] w-[76px] shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/20 md:h-auto md:w-full md:aspect-[2/3] ${canDragItem(slotItem) ? 'cursor-grab touch-none select-none active:cursor-grabbing' : ''}`}
            >
              <span className="absolute left-2 top-2 z-10 rounded bg-black/75 px-2 py-1 font-mono text-[10px] font-black text-noir-gold">#{position}</span>
              {canDragItem(slotItem) && <span className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded bg-black/75 text-neutral-300"><GripVertical size={14} /></span>}
              {slotItem ? <PriorityCover item={slotItem} className="h-full w-full" /> : <div className="flex h-full w-full items-center justify-center px-3 text-center font-mono text-[9px] uppercase tracking-widest text-neutral-600">Vazio</div>}
              {isNewItem && <div className="pointer-events-none absolute inset-0 border-2 border-noir-gold/70 bg-noir-gold/10" />}
            </div>

            <div className="ml-3 min-w-0 flex-1 pt-1 md:ml-0 md:mt-3 md:flex-none md:pt-0">
              {slotItem ? (
                <>
                  <strong className="block truncate text-sm text-white">{slotItem.title}</strong>
                  <span className="mt-1 block truncate font-mono text-[9px] uppercase tracking-wider text-neutral-500">{isNewItem ? 'Nova posicao' : slotItem.creator || 'Criador nao informado'}</span>
                  {isManagingList && <button type="button" aria-label="Remover da lista" disabled={isSaving} onClick={(event) => { event.stopPropagation(); void onRemoveItem?.(slotItem) }} className="mt-3 flex h-7 w-7 items-center justify-center rounded border border-red-400/20 bg-red-500/10 text-red-300 transition-colors hover:border-red-300/40 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-30 md:ml-auto"><Trash2 size={13} /></button>}
                </>
              ) : (
                <>
                  <strong className="block text-sm text-neutral-500">Posição vazia</strong>
                  <span className="mt-1 block font-mono text-[9px] uppercase tracking-wider text-neutral-700">Inserir aqui</span>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

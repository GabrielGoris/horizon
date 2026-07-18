import { useCallback, useState } from "react";
import { useToast } from "../../../../components/ToastProvider/hooks/useToast";
import { moveMediaToWishlist, removeMediaFromWishlist } from "../../../../services/wishlistService";
import type { MediaItem, MediaType } from "../../../../types";
import type { UseWishlistPriorityParams } from "../types";

export function useWishlistPriority({ collection, refreshMedia }: UseWishlistPriorityParams) {
  const { notify } = useToast();
  const [mediaToPrioritize, setMediaToPrioritize] = useState<MediaItem | null>(null);
  const [managedWishlistType, setManagedWishlistType] = useState<MediaType | null>(null);
  const [isSavingWishlist, setIsSavingWishlist] = useState(false);
  const wishlistDialogCollection = mediaToPrioritize && !collection.some((item) => item.id === mediaToPrioritize.id)
    ? [mediaToPrioritize, ...collection]
    : collection;

  const confirmWishlistPosition = useCallback(async (position: number) => {
    if (!mediaToPrioritize) return;

    const wishlistCollection = collection.some((item) => item.id === mediaToPrioritize.id)
      ? collection
      : [mediaToPrioritize, ...collection];

    setIsSavingWishlist(true);
    try {
      await moveMediaToWishlist(wishlistCollection, mediaToPrioritize, position);
    } catch (error) {
      console.error(error);
      notify({ tone: "error", title: "Prioridade não atualizada", message: "Não foi possível atualizar a lista de prioridade." });
      setIsSavingWishlist(false);
      return;
    }

    setIsSavingWishlist(false);
    setMediaToPrioritize(null);
    setManagedWishlistType(null);
    await refreshMedia();
    notify({ tone: "success", title: "Prioridade atualizada", message: `“${mediaToPrioritize.title}” agora ocupa a posição #${position}.` });
  }, [collection, mediaToPrioritize, notify, refreshMedia]);

  const moveWishlistItem = useCallback(async (item: MediaItem, position: number) => {
    setIsSavingWishlist(true);
    try {
      await moveMediaToWishlist(collection, item, position);
    } catch (error) {
      console.error(error);
      notify({ tone: "error", title: "Prioridade não atualizada", message: "Não foi possível mover este item na lista." });
      setIsSavingWishlist(false);
      return;
    }

    setIsSavingWishlist(false);
    await refreshMedia();
    notify({ tone: "success", title: "Prioridade atualizada", message: `“${item.title}” agora ocupa a posição #${position}.` });
  }, [collection, notify, refreshMedia]);

  const removeWishlistItem = useCallback(async (item: MediaItem) => {
    setIsSavingWishlist(true);
    try {
      await removeMediaFromWishlist(collection, item);
    } catch (error) {
      console.error(error);
      notify({ tone: "error", title: "Item não removido", message: "Não foi possível remover o item da lista de prioridade." });
      setIsSavingWishlist(false);
      return;
    }

    setIsSavingWishlist(false);
    await refreshMedia();
    notify({ tone: "success", title: "Prioridade removida", message: `“${item.title}” saiu da lista de prioridade.` });
  }, [collection, notify, refreshMedia]);

  const cancelWishlistPriority = () => {
    if (!isSavingWishlist) {
      setMediaToPrioritize(null);
      setManagedWishlistType(null);
    }
  };

  return {
    cancelWishlistPriority,
    confirmWishlistPosition,
    isSavingWishlist,
    managedWishlistType,
    mediaToPrioritize,
    moveWishlistItem,
    removeWishlistItem,
    setManagedWishlistType,
    setMediaToPrioritize,
    wishlistDialogCollection,
  };
}

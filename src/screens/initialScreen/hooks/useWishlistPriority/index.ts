import { useCallback, useState } from "react";
import { moveMediaToWishlist, removeMediaFromWishlist } from "../../../../services/wishlistService";
import type { MediaItem, MediaType } from "../../../../types";
import type { UseWishlistPriorityParams } from "../types";

export function useWishlistPriority({ collection, refreshMedia }: UseWishlistPriorityParams) {
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
      alert("Erro ao atualizar a lista de prioridade.");
      setIsSavingWishlist(false);
      return;
    }

    setIsSavingWishlist(false);
    setMediaToPrioritize(null);
    setManagedWishlistType(null);
    await refreshMedia();
  }, [collection, mediaToPrioritize, refreshMedia]);

  const moveWishlistItem = useCallback(async (item: MediaItem, position: number) => {
    setIsSavingWishlist(true);
    try {
      await moveMediaToWishlist(collection, item, position);
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar a lista de prioridade.");
      setIsSavingWishlist(false);
      return;
    }

    setIsSavingWishlist(false);
    await refreshMedia();
  }, [collection, refreshMedia]);

  const removeWishlistItem = useCallback(async (item: MediaItem) => {
    setIsSavingWishlist(true);
    try {
      await removeMediaFromWishlist(collection, item);
    } catch (error) {
      console.error(error);
      alert("Erro ao remover da lista de prioridade.");
      setIsSavingWishlist(false);
      return;
    }

    setIsSavingWishlist(false);
    await refreshMedia();
  }, [collection, refreshMedia]);

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

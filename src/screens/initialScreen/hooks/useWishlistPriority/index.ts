import { useCallback, useState } from "react";
import { moveMediaToWishlist } from "../../../../services/wishlistService";
import type { MediaItem } from "../../../../types";
import type { UseWishlistPriorityParams } from "../types";

export function useWishlistPriority({ collection, refreshMedia }: UseWishlistPriorityParams) {
  const [mediaToPrioritize, setMediaToPrioritize] = useState<MediaItem | null>(null);
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
    await refreshMedia();
  }, [collection, mediaToPrioritize, refreshMedia]);

  const cancelWishlistPriority = () => {
    if (!isSavingWishlist) {
      setMediaToPrioritize(null);
    }
  };

  return {
    cancelWishlistPriority,
    confirmWishlistPosition,
    isSavingWishlist,
    mediaToPrioritize,
    setMediaToPrioritize,
    wishlistDialogCollection,
  };
}

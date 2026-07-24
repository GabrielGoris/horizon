import { useCallback, useState } from "react";
import { useToast } from "../../../../components/ToastProvider/hooks/useToast";
import { fetchWishlistMedia } from "../../../../services/mediaService";
import { moveMediaToWishlist, removeMediaFromWishlist } from "../../../../services/wishlistService";
import type { MediaItem, MediaType } from "../../../../types";
import type { UseWishlistPriorityParams } from "../types";

export function useWishlistPriority({ refreshMedia }: UseWishlistPriorityParams) {
  const { notify } = useToast();
  const [mediaToPrioritize, setMediaToPrioritize] = useState<MediaItem | null>(null);
  const [managedWishlistType, setManagedWishlistType] = useState<MediaType | null>(null);
  const [wishlistItems, setWishlistItems] = useState<MediaItem[]>([]);
  const [isSavingWishlist, setIsSavingWishlist] = useState(false);
  const wishlistDialogCollection = mediaToPrioritize && !wishlistItems.some((item) => item.id === mediaToPrioritize.id)
    ? [mediaToPrioritize, ...wishlistItems]
    : wishlistItems;

  const loadWishlist = useCallback(async (type: MediaType) => {
    const items = await fetchWishlistMedia(type);
    setWishlistItems(items);
    return items;
  }, []);

  const openPrioritizeMedia = useCallback(async (item: MediaItem) => {
    try {
      await loadWishlist(item.type);
      setMediaToPrioritize(item);
      setManagedWishlistType(null);
    } catch (error) {
      console.error(error);
      notify({ tone: "error", title: "Lista indisponível", message: "Não foi possível carregar a lista de prioridade." });
    }
  }, [loadWishlist, notify]);

  const openManagedWishlist = useCallback(async (type: MediaType) => {
    try {
      await loadWishlist(type);
      setManagedWishlistType(type);
      setMediaToPrioritize(null);
    } catch (error) {
      console.error(error);
      notify({ tone: "error", title: "Lista indisponível", message: "Não foi possível carregar a lista de prioridade." });
    }
  }, [loadWishlist, notify]);

  const confirmWishlistPosition = useCallback(async (position: number) => {
    if (!mediaToPrioritize) return;

    const wishlistCollection = wishlistItems.some((item) => item.id === mediaToPrioritize.id)
      ? wishlistItems
      : [mediaToPrioritize, ...wishlistItems];

    setIsSavingWishlist(true);
    try {
      await moveMediaToWishlist(wishlistCollection, mediaToPrioritize, position);
      await Promise.all([refreshMedia(), loadWishlist(mediaToPrioritize.type)]);
    } catch (error) {
      console.error(error);
      notify({ tone: "error", title: "Prioridade não atualizada", message: "Não foi possível atualizar a lista de prioridade." });
      return;
    } finally {
      setIsSavingWishlist(false);
    }

    setMediaToPrioritize(null);
    setManagedWishlistType(null);
    notify({ tone: "success", title: "Prioridade atualizada", message: `“${mediaToPrioritize.title}” agora ocupa a posição #${position}.` });
  }, [loadWishlist, mediaToPrioritize, notify, refreshMedia, wishlistItems]);

  const moveWishlistItem = useCallback(async (item: MediaItem, position: number) => {
    setIsSavingWishlist(true);
    try {
      await moveMediaToWishlist(wishlistItems, item, position);
      await Promise.all([refreshMedia(), loadWishlist(item.type)]);
      notify({ tone: "success", title: "Prioridade atualizada", message: `“${item.title}” agora ocupa a posição #${position}.` });
    } catch (error) {
      console.error(error);
      notify({ tone: "error", title: "Prioridade não atualizada", message: "Não foi possível mover este item na lista." });
    } finally {
      setIsSavingWishlist(false);
    }
  }, [loadWishlist, notify, refreshMedia, wishlistItems]);

  const removeWishlistItem = useCallback(async (item: MediaItem) => {
    setIsSavingWishlist(true);
    try {
      await removeMediaFromWishlist(wishlistItems, item);
      await Promise.all([refreshMedia(), loadWishlist(item.type)]);
      notify({ tone: "success", title: "Prioridade removida", message: `“${item.title}” saiu da lista de prioridade.` });
    } catch (error) {
      console.error(error);
      notify({ tone: "error", title: "Item não removido", message: "Não foi possível remover o item da lista de prioridade." });
    } finally {
      setIsSavingWishlist(false);
    }
  }, [loadWishlist, notify, refreshMedia, wishlistItems]);

  const cancelWishlistPriority = () => {
    if (!isSavingWishlist) {
      setMediaToPrioritize(null);
      setManagedWishlistType(null);
      setWishlistItems([]);
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
    setManagedWishlistType: openManagedWishlist,
    setMediaToPrioritize: openPrioritizeMedia,
    wishlistDialogCollection,
  };
}

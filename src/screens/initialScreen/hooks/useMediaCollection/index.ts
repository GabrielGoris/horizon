import { useCallback, useEffect, useState } from "react";
import type { AudiovisualCompletionDTO, BookCompletionDTO, GameCompletionDTO } from "../../../../schemas/media";
import {
  applyAudiovisualCompletion,
  applyBookCompletion,
  applyGameCompletion,
  completeMedia,
  deleteMedia,
  fetchMedia,
  markMediaAsComplete,
  saveAudiovisualCompletion,
  saveBookCompletion,
  saveGameCompletion,
  updateMediaMeta,
  updateMediaStatus,
} from "../../../../services/mediaService";
import { removeMediaFromWishlist } from "../../../../services/wishlistService";
import type { MediaItem, MediaStatus } from "../../../../types";

export function useMediaCollection() {
  const [collection, setCollection] = useState<MediaItem[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(true);
  const [mediaLoadError, setMediaLoadError] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [mediaToDelete, setMediaToDelete] = useState<MediaItem | null>(null);
  const [isDeletingMedia, setIsDeletingMedia] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetchMedia()
      .then((media) => {
        if (isMounted) {
          setCollection(media);
          setMediaLoadError("");
        }
      })
      .catch((error) => {
        console.error(error);
        if (isMounted) {
          const isPermissionError = typeof error === "object"
            && error !== null
            && "code" in error
            && error.code === "42501";

          setMediaLoadError(
            isPermissionError
              ? "O Supabase recusou o acesso a biblioteca. Verifique os grants e as políticas RLS."
              : "Não foi possivel carregar a biblioteca."
          );
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingMedia(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshMedia = useCallback(async () => {
    setIsLoadingMedia(true);

    try {
      const media = await fetchMedia();

      setCollection(media);
      setMediaLoadError("");

      return media;
    } catch (error) {
      console.error(error);
      setMediaLoadError("Nao foi possivel atualizar a biblioteca.");
      throw error;
    } finally {
      setIsLoadingMedia(false);
    }
  }, []);

  const updateMedia = useCallback((updatedMedia: MediaItem) => {
    setCollection((currentCollection) =>
      currentCollection.map((media) => (media.id === updatedMedia.id ? updatedMedia : media))
    );
    setSelectedMedia(updatedMedia);
  }, []);

  const handleUpdateMediaStatus = useCallback(async (item: MediaItem, status: MediaStatus) => {
    try {
      if (status === "complete") {
        await completeMedia(item.id);
      } else {
        await updateMediaStatus(item.id, status);
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar o status da obra.");
      return;
    }

    if (status === "complete" && item.wishlist_position) {
      try {
        await removeMediaFromWishlist(collection, item);
      } catch (error) {
        console.error(error);
        alert("Obra concluida, mas não foi possivel remover da lista de prioridade.");
      }
    }

    const refreshedCollection = await refreshMedia();
    const refreshedMedia = refreshedCollection.find((media) => media.id === item.id);

    setSelectedMedia(refreshedMedia ?? (status === "complete" ? markMediaAsComplete(item) : { ...item, status }));
  }, [collection, refreshMedia]);

  const handleCompleteMedia = useCallback(async (item: MediaItem) => {
    await handleUpdateMediaStatus(item, "complete");
  }, [handleUpdateMediaStatus]);

  const handleSaveAudiovisualCompletion = useCallback(async (item: MediaItem, completion: AudiovisualCompletionDTO) => {
    try {
      await saveAudiovisualCompletion(item.id, completion);
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar o ticket.");
      return;
    }

    updateMedia(applyAudiovisualCompletion(item, completion));
  }, [updateMedia]);

  const handleSaveBookCompletion = useCallback(async (item: MediaItem, completion: BookCompletionDTO) => {
    try {
      await saveBookCompletion(item.id, completion);
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar a leitura.");
      return;
    }

    updateMedia(applyBookCompletion(item, completion));
  }, [updateMedia]);

  const handleSaveGameCompletion = useCallback(async (item: MediaItem, completion: GameCompletionDTO) => {
    try {
      await saveGameCompletion(item.id, completion);
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar o save.");
      return;
    }

    updateMedia(applyGameCompletion(item, completion));
  }, [updateMedia]);

  const handleUpdateMediaMeta = useCallback(async (item: MediaItem, meta: string) => {
    try {
      await updateMediaMeta(item.id, meta);
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar a plataforma.");
      return;
    }

    updateMedia({ ...item, meta });
  }, [updateMedia]);

  const confirmDeleteMedia = useCallback(async () => {
    if (!mediaToDelete) return;

    setIsDeletingMedia(true);
    try {
      await deleteMedia(mediaToDelete.id);
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir a obra.");
      setIsDeletingMedia(false);
      return;
    }

    setIsDeletingMedia(false);
    setMediaToDelete(null);
    setSelectedMedia(null);
    await refreshMedia();
  }, [mediaToDelete, refreshMedia]);

  return {
    collection,
    confirmDeleteMedia,
    handleCompleteMedia,
    handleSaveBookCompletion,
    handleSaveGameCompletion,
    handleSaveAudiovisualCompletion,
    handleUpdateMediaMeta,
    handleUpdateMediaStatus,
    isLoadingMedia,
    isDeletingMedia,
    mediaLoadError,
    mediaToDelete,
    refreshMedia,
    selectedMedia,
    setMediaToDelete,
    setSelectedMedia,
  };
}

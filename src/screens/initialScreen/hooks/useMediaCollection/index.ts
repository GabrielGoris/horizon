import { useCallback, useEffect, useState } from "react";
import { useToast } from "../../../../components/ToastProvider/hooks/useToast";
import type { AudiovisualCompletionDTO, BookCompletionDTO, GameCompletionDTO, UpdateMediaDetailsDTO } from "../../../../schemas/media";
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
  updateMediaDetails,
  updateMediaStatus,
} from "../../../../services/mediaService";
import { removeMediaFromWishlist } from "../../../../services/wishlistService";
import type { MediaItem, MediaStatus } from "../../../../types";
import { LIBRARY_UPDATED_EVENT } from "../../../../utils/libraryEvents";

export function useMediaCollection() {
  const { notify } = useToast();
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

  useEffect(() => {
    const handleLibraryUpdate = () => {
      void refreshMedia().catch(() => undefined);
    };

    window.addEventListener(LIBRARY_UPDATED_EVENT, handleLibraryUpdate);

    return () => {
      window.removeEventListener(LIBRARY_UPDATED_EVENT, handleLibraryUpdate);
    };
  }, [refreshMedia]);

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
      notify({ tone: "error", title: "Status não atualizado", message: "Não foi possível atualizar o estado da obra." });
      return;
    }

    if (status === "complete" && item.wishlist_position) {
      try {
        await removeMediaFromWishlist(collection, item);
      } catch (error) {
        console.error(error);
        notify({ tone: "warning", title: "Obra concluída", message: "A conclusão foi salva, mas o item continua na lista de prioridade." });
      }
    }

    const refreshedCollection = await refreshMedia();
    const refreshedMedia = refreshedCollection.find((media) => media.id === item.id);

    setSelectedMedia(refreshedMedia ?? (status === "complete" ? markMediaAsComplete(item) : { ...item, status }));
    notify({ tone: "success", title: "Status atualizado", message: `O estado de “${item.title}” foi atualizado.` });
  }, [collection, notify, refreshMedia]);

  const handleCompleteMedia = useCallback(async (item: MediaItem) => {
    await handleUpdateMediaStatus(item, "complete");
  }, [handleUpdateMediaStatus]);

  const handleSaveAudiovisualCompletion = useCallback(async (item: MediaItem, completion: AudiovisualCompletionDTO) => {
    try {
      await saveAudiovisualCompletion(item.id, completion);
    } catch (error) {
      console.error(error);
      notify({ tone: "error", title: "Ingresso não salvo", message: "Não foi possível salvar os dados desta sessão." });
      return;
    }

    updateMedia(applyAudiovisualCompletion(item, completion));
    notify({ tone: "success", title: "Sessão registrada", message: `Os dados de “${item.title}” foram salvos.` });
  }, [notify, updateMedia]);

  const handleSaveBookCompletion = useCallback(async (item: MediaItem, completion: BookCompletionDTO) => {
    try {
      await saveBookCompletion(item.id, completion);
    } catch (error) {
      console.error(error);
      notify({ tone: "error", title: "Leitura não salva", message: "Não foi possível salvar os dados desta leitura." });
      return;
    }

    updateMedia(applyBookCompletion(item, completion));
    notify({ tone: "success", title: "Leitura registrada", message: `Os dados de “${item.title}” foram salvos.` });
  }, [notify, updateMedia]);

  const handleSaveGameCompletion = useCallback(async (item: MediaItem, completion: GameCompletionDTO) => {
    try {
      await saveGameCompletion(item.id, completion);
    } catch (error) {
      console.error(error);
      notify({ tone: "error", title: "Memory card não salvo", message: "Não foi possível salvar os dados desta partida." });
      return;
    }

    updateMedia(applyGameCompletion(item, completion));
    notify({ tone: "success", title: "Partida registrada", message: `Os dados de “${item.title}” foram salvos.` });
  }, [notify, updateMedia]);

  const handleUpdateMediaMeta = useCallback(async (item: MediaItem, meta: string) => {
    try {
      await updateMediaMeta(item.id, meta);
    } catch (error) {
      console.error(error);
      notify({ tone: "error", title: "Plataforma não atualizada", message: "Não foi possível alterar a plataforma do jogo." });
      return;
    }

    updateMedia({ ...item, meta });
    notify({ tone: "success", title: "Plataforma atualizada", message: `A plataforma de “${item.title}” foi alterada.` });
  }, [notify, updateMedia]);

  const handleUpdateMediaDetails = useCallback(async (item: MediaItem, details: UpdateMediaDetailsDTO) => {
    try {
      await updateMediaDetails(item.id, details);
      const refreshedCollection = await refreshMedia();
      const refreshedMedia = refreshedCollection.find((media) => media.id === item.id);

      if (refreshedMedia) setSelectedMedia(refreshedMedia);
      notify({ tone: "success", title: "Obra atualizada", message: `As informações de “${item.title}” foram salvas.` });
    } catch (error) {
      console.error(error);
      notify({ tone: "error", title: "Alterações não salvas", message: "Não foi possível atualizar as informações da obra." });
      throw error;
    }
  }, [notify, refreshMedia]);

  const confirmDeleteMedia = useCallback(async () => {
    if (!mediaToDelete) return;

    setIsDeletingMedia(true);
    try {
      await deleteMedia(mediaToDelete);
    } catch (error) {
      console.error(error);
      notify({ tone: "error", title: "Obra não excluída", message: "Não foi possível remover a obra da biblioteca." });
      setIsDeletingMedia(false);
      return;
    }

    setIsDeletingMedia(false);
    setMediaToDelete(null);
    setSelectedMedia(null);
    await refreshMedia();
    notify({ tone: "success", title: "Obra excluída", message: `“${mediaToDelete.title}” foi removida da biblioteca.` });
  }, [mediaToDelete, notify, refreshMedia]);

  return {
    collection,
    confirmDeleteMedia,
    handleCompleteMedia,
    handleSaveBookCompletion,
    handleSaveGameCompletion,
    handleSaveAudiovisualCompletion,
    handleUpdateMediaMeta,
    handleUpdateMediaDetails,
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

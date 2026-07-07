import { useCallback, useEffect, useState } from "react";
import type { BookCompletionDTO, GameCompletionDTO, MovieTicketDTO } from "../../../../schemas/media";
import {
  applyBookCompletion,
  applyGameCompletion,
  applyMovieTicket,
  completeMedia,
  deleteMedia,
  fetchMedia,
  markMediaAsComplete,
  saveBookCompletion,
  saveGameCompletion,
  saveMovieTicket,
} from "../../../../services/mediaService";
import type { MediaItem } from "../../../../types";

export function useMediaCollection() {
  const [collection, setCollection] = useState<MediaItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [mediaToDelete, setMediaToDelete] = useState<MediaItem | null>(null);
  const [isDeletingMedia, setIsDeletingMedia] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetchMedia()
      .then((media) => {
        if (isMounted) {
          setCollection(media);
        }
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshMedia = useCallback(async () => {
    const media = await fetchMedia();

    setCollection(media);
  }, []);

  const updateMedia = useCallback((updatedMedia: MediaItem) => {
    setCollection((currentCollection) =>
      currentCollection.map((media) => (media.id === updatedMedia.id ? updatedMedia : media))
    );
    setSelectedMedia(updatedMedia);
  }, []);

  const handleCompleteMedia = useCallback(async (item: MediaItem) => {
    try {
      await completeMedia(item.id);
    } catch (error) {
      console.error(error);
      alert("Erro ao concluir a obra.");
      return;
    }

    updateMedia(markMediaAsComplete(item));
  }, [updateMedia]);

  const handleSaveMovieTicket = useCallback(async (item: MediaItem, ticket: MovieTicketDTO) => {
    try {
      await saveMovieTicket(item.id, ticket);
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar o ticket.");
      return;
    }

    updateMedia(applyMovieTicket(item, ticket));
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
    handleSaveMovieTicket,
    isDeletingMedia,
    mediaToDelete,
    refreshMedia,
    selectedMedia,
    setMediaToDelete,
    setSelectedMedia,
  };
}

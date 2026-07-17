import { useCallback, useState } from "react";
import type {
  AudiovisualCompletionDTO,
  BookCompletionDTO,
  GameCompletionDTO,
  UpdateMediaDetailsDTO,
} from "../../schemas/media";
import {
  applyAudiovisualCompletion,
  applyBookCompletion,
  applyGameCompletion,
  completeMedia,
  fetchMediaItem,
  saveAudiovisualCompletion,
  saveBookCompletion,
  saveGameCompletion,
  updateMediaDetails,
  updateMediaMeta,
  updateMediaStatus,
} from "../../services/mediaService";
import type { MediaItem, MediaStatus } from "../../types";

type MediaIdentity = {
  externalId?: string;
  id?: string;
  source?: string;
};

export function useMediaEditor() {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isOpeningMedia, setIsOpeningMedia] = useState(false);

  const openMedia = useCallback(async (identity: MediaIdentity) => {
    setIsOpeningMedia(true);

    try {
      const media = await fetchMediaItem(identity);

      setSelectedMedia(media);
      return media;
    } finally {
      setIsOpeningMedia(false);
    }
  }, []);

  const refreshSelectedMedia = useCallback(async (item: MediaItem) => {
    const refreshedMedia = await fetchMediaItem({ id: item.id });

    setSelectedMedia(refreshedMedia);
    return refreshedMedia;
  }, []);

  const handleUpdateMediaDetails = useCallback(async (item: MediaItem, details: UpdateMediaDetailsDTO) => {
    await updateMediaDetails(item.id, details);
    await refreshSelectedMedia(item);
  }, [refreshSelectedMedia]);

  const handleUpdateMediaMeta = useCallback(async (item: MediaItem, meta: string) => {
    await updateMediaMeta(item.id, meta);
    setSelectedMedia({ ...item, meta });
  }, []);

  const handleUpdateMediaStatus = useCallback(async (item: MediaItem, status: MediaStatus) => {
    if (status === "complete") await completeMedia(item.id);
    else await updateMediaStatus(item.id, status);

    await refreshSelectedMedia(item);
  }, [refreshSelectedMedia]);

  const handleSaveAudiovisualCompletion = useCallback(async (item: MediaItem, completion: AudiovisualCompletionDTO) => {
    await saveAudiovisualCompletion(item.id, completion);
    setSelectedMedia(applyAudiovisualCompletion(item, completion));
  }, []);

  const handleSaveBookCompletion = useCallback(async (item: MediaItem, completion: BookCompletionDTO) => {
    await saveBookCompletion(item.id, completion);
    setSelectedMedia(applyBookCompletion(item, completion));
  }, []);

  const handleSaveGameCompletion = useCallback(async (item: MediaItem, completion: GameCompletionDTO) => {
    await saveGameCompletion(item.id, completion);
    setSelectedMedia(applyGameCompletion(item, completion));
  }, []);

  return {
    closeMedia: () => setSelectedMedia(null),
    handleCompleteMedia: (item: MediaItem) => handleUpdateMediaStatus(item, "complete"),
    handleSaveAudiovisualCompletion,
    handleSaveBookCompletion,
    handleSaveGameCompletion,
    handleUpdateMediaDetails,
    handleUpdateMediaMeta,
    handleUpdateMediaStatus,
    isOpeningMedia,
    openMedia,
    selectedMedia,
  };
}

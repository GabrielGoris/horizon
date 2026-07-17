import type { AudiovisualCompletionDTO, BookCompletionDTO, GameCompletionDTO, UpdateMediaDetailsDTO } from "../../../schemas/media";
import type { MediaItem, MediaStatus } from "../../../types";

export interface MediaDossierProps {
  item: MediaItem;
  onClose: () => void;
  onComplete: (item: MediaItem) => void | Promise<void>;
  onDelete: (item: MediaItem) => void | Promise<void>;
  onDetailsChange: (item: MediaItem, details: UpdateMediaDetailsDTO) => void | Promise<void>;
  onMetaChange: (item: MediaItem, meta: string) => void | Promise<void>;
  onStatusChange: (item: MediaItem, status: MediaStatus) => void | Promise<void>;
  onSaveAudiovisualCompletion: (item: MediaItem, completion: AudiovisualCompletionDTO) => void | Promise<void>;
  onSaveBookCompletion: (item: MediaItem, completion: BookCompletionDTO) => void | Promise<void>;
  onSaveGameCompletion: (item: MediaItem, completion: GameCompletionDTO) => void | Promise<void>;
  showDeleteAction?: boolean;
}

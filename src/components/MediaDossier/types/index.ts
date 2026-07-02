import type { BookCompletionDTO, GameCompletionDTO, MovieTicketDTO } from "../../../schemas/media";
import type { MediaItem } from "../../../types";

export interface MediaDossierProps {
  item: MediaItem;
  onClose: () => void;
  onComplete: (item: MediaItem) => void | Promise<void>;
  onDelete: (item: MediaItem) => void | Promise<void>;
  onSaveTicket: (item: MediaItem, ticket: MovieTicketDTO) => void | Promise<void>;
  onSaveBookCompletion: (item: MediaItem, completion: BookCompletionDTO) => void | Promise<void>;
  onSaveGameCompletion: (item: MediaItem, completion: GameCompletionDTO) => void | Promise<void>;
}

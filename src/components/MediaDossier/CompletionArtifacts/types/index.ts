import type { MovieTicketDTO } from "../../../../schemas/media";
import type { MediaItem } from "../../../../types";

export interface CompletionArtifactProps {
  item: MediaItem;
  onSaveTicket: (item: MediaItem, ticket: MovieTicketDTO) => void | Promise<void>;
}

export interface MovieTicketProps {
  item: MediaItem;
  watchedAt: string;
  rating: number;
  onClick: () => void;
}

export interface MovieTicketEditorProps {
  item: MediaItem;
  watchedAt: string;
  rating: number;
  stars: number[];
  onWatchedAtChange: (watchedAt: string) => void;
  onRatingChange: (rating: number) => void;
  onClose: () => void;
  onSave: () => void | Promise<void>;
}

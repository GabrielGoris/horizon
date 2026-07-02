import type { BookCompletionDTO, GameCompletionDTO, MovieTicketDTO } from "../../../../schemas/media";
import type { MediaItem } from "../../../../types";

export interface CompletionArtifactProps {
  item: MediaItem;
  onSaveTicket: (item: MediaItem, ticket: MovieTicketDTO) => void | Promise<void>;
  onSaveBookCompletion: (item: MediaItem, completion: BookCompletionDTO) => void | Promise<void>;
  onSaveGameCompletion: (item: MediaItem, completion: GameCompletionDTO) => void | Promise<void>;
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

export interface BookBookmarkProps {
  item: MediaItem;
  finishedAt: string;
  rating: number;
  pages: string;
  onClick: () => void;
}

export interface BookBookmarkEditorProps {
  item: MediaItem;
  finishedAt: string;
  rating: number;
  pages: string;
  stars: number[];
  onFinishedAtChange: (finishedAt: string) => void;
  onRatingChange: (rating: number) => void;
  onPagesChange: (pages: string) => void;
  onClose: () => void;
  onSave: () => void | Promise<void>;
}

export interface GameSaveCardProps {
  item: MediaItem;
  finishedAt: string;
  rating: number;
  hoursPlayed: string;
  completionType: string;
  onClick: () => void;
}

export interface GameSaveEditorProps {
  item: MediaItem;
  finishedAt: string;
  rating: number;
  hoursPlayed: string;
  completionType: string;
  stars: number[];
  onFinishedAtChange: (finishedAt: string) => void;
  onRatingChange: (rating: number) => void;
  onHoursPlayedChange: (hoursPlayed: string) => void;
  onCompletionTypeChange: (completionType: string) => void;
  onClose: () => void;
  onSave: () => void | Promise<void>;
}

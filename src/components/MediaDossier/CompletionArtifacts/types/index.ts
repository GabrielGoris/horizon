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
  onWatchedAtChange: (watchedAt: string) => void;
  onRatingChange: (rating: number) => void;
  onSave: (values?: { watchedAt?: string; rating?: number }) => void | Promise<void>;
}

export interface BookBookmarkProps {
  item: MediaItem;
  finishedAt: string;
  rating: number;
  onFinishedAtChange: (finishedAt: string) => void;
  onRatingChange: (rating: number) => void;
  onSave: (values?: { finishedAt?: string; rating?: number }) => void | Promise<void>;
}

export interface GameSaveCardProps {
  item: MediaItem;
  finishedAt: string;
  rating: number;
  hoursPlayed: string;
  completionType: string;
  onFinishedAtChange: (finishedAt: string) => void;
  onRatingChange: (rating: number) => void;
  onHoursPlayedChange: (hoursPlayed: string) => void;
  onCompletionTypeChange: (completionType: string) => void;
  onSave: (values?: {
    finishedAt?: string;
    rating?: number;
    hoursPlayed?: string;
    completionType?: string;
  }) => void | Promise<void>;
}

export type MediaType = 'animes' | 'movies' | 'games' | 'books';
export type MediaStatus = 'complete' | 'dropped' | 'in_progress' | 'queue';
export type MediaFormat = 'movie' | 'series';

export interface MediaItem {
  id: string;
  user_id?: string;
  title: string;
  creator: string;
  director?: string;
  category: string;
  cover: string;
  backdrop?: string;
  type: MediaType;
  media_format?: MediaFormat;
  status: MediaStatus;
  releaseYear: string;
  meta: string;
  rating: string;
  description: string;
  added_at?: string;
  completed_year?: number | string;
  watched_at?: string;
  completed_at?: string;
  page_count?: number | string;
  runtime_minutes?: number | string;
  season_count?: number | string;
  episode_count?: number | string;
  campaign_hours?: number | string;
  wishlist_position?: number | string;
  wishlist_added_at?: string;
  pages?: number | string;
  hours_played?: number | string;
  completion_type?: string;
  progress?: {
    current: number;
    total: number;
    unit: string;
  };
}

export type CompletionRow = {
  rating?: number | string | null;
};

export type AudiovisualCompletionRow = CompletionRow & {
  watched_at?: string | null;
};

export type BookCompletionRow = CompletionRow & {
  finished_at?: string | null;
  pages?: number | string | null;
};

export type GameCompletionRow = CompletionRow & {
  finished_at?: string | null;
  hours_played?: number | string | null;
  completion_type?: string | null;
};

export type MediaItemRow = Omit<MediaItem, "releaseYear" | "rating" | "status"> & {
  user_id?: string | null;
  release_year?: string | null;
  status: MediaStatus;
  media_format?: MediaFormat | null;
  added_at?: string | null;
  completed_year?: number | string | null;
  page_count?: number | string | null;
  runtime_minutes?: number | string | null;
  season_count?: number | string | null;
  episode_count?: number | string | null;
  campaign_hours?: number | string | null;
  wishlist_position?: number | string | null;
  wishlist_added_at?: string | null;
  rating?: string | number | null;
  audiovisual_completions?: AudiovisualCompletionRow[] | AudiovisualCompletionRow | null;
  book_completions?: BookCompletionRow[] | BookCompletionRow | null;
  game_completions?: GameCompletionRow[] | GameCompletionRow | null;
};

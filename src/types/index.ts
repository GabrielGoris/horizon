export type MediaType = 'games' | 'movies' | 'books';
export type MediaStatus = 'complete' | 'new' | 'queue' | 'reading';

export interface MediaItem {
  id: string;
  title: string;
  creator: string;
  director?: string;
  category: string;
  cover: string;
  backdrop?: string;
  type: MediaType;
  status: MediaStatus;
  releaseYear: string;
  meta: string;
  rating: string;
  description: string;
  watched_at?: string;
  completed_at?: string;
  page_count?: number | string;
  runtime_minutes?: number | string;
  campaign_hours?: number | string;
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

export type MovieCompletionRow = CompletionRow & {
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

export type MediaItemRow = Omit<MediaItem, "releaseYear" | "rating"> & {
  release_year?: string | null;
  page_count?: number | string | null;
  runtime_minutes?: number | string | null;
  campaign_hours?: number | string | null;
  rating?: string | number | null;
  movie_completions?: MovieCompletionRow[] | MovieCompletionRow | null;
  book_completions?: BookCompletionRow[] | BookCompletionRow | null;
  game_completions?: GameCompletionRow[] | GameCompletionRow | null;
};

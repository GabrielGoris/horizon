export type MediaType = 'games' | 'movies' | 'books';
export type MediaStatus = 'complete' | 'new' | 'queue' | 'reading';

export interface MediaItem {
  id: string;
  title: string;
  creator: string;
  director?: string;
  category: string;
  cover: string;
  type: MediaType;
  status: MediaStatus;
  releaseYear: string;
  meta: string;
  rating: string;
  description: string;
  watched_at?: string;
  completed_at?: string;
  progress?: {
    current: number;
    total: number;
    unit: string;
  };
}

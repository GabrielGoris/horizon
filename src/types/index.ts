export type MediaType = 'games' | 'movies' | 'books';
export type MediaStatus = 'complete' | 'new' | 'queue' | 'reading';

export interface MediaItem {
  id: string;
  title: string;
  creator: string;
  category: string;
  cover: string;
  type: MediaType;
  status: MediaStatus;
  releaseYear: string;
  meta: string;
  rating: string;
  description: string;
  progress?: {
    current: number;
    total: number;
    unit: string;
  };
}
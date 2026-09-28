import type { MediaItem } from "../../../types";

export interface MediaCardProps {
  item: MediaItem;
  onClick?: (item: MediaItem) => void;
  onPrioritize?: (item: MediaItem) => void;
  onQuickActions?: (item: MediaItem) => void;
  rank?: number; 
}

import type { MediaItem } from "../../../types";

export interface MediaCardProps {
  item: MediaItem;
  onClick?: (item: MediaItem) => void;
  rank?: number; 
}
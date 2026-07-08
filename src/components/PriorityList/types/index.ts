import type { MediaItem } from "../../../types";

export type PriorityListProps = {
  items: MediaItem[];
  pendingItem?: MediaItem;
  isManagingList: boolean;
  isSaving?: boolean;
  onPositionPreview?: (position: number) => void;
  onMoveItem?: (item: MediaItem, position: number) => void | Promise<void>;
  onRemoveItem?: (item: MediaItem) => void | Promise<void>;
};

export type PriorityCoverProps = {
  item: MediaItem;
  className: string;
};

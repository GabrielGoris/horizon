import type { MediaItem, MediaType } from "../../../types";

export type WishlistPriorityDialogProps = {
  collection: MediaItem[];
  item?: MediaItem;
  isSaving?: boolean;
  onCancel: () => void;
  onConfirm?: (position: number) => void | Promise<void>;
  onMoveItem?: (item: MediaItem, position: number) => void | Promise<void>;
  onRemoveItem?: (item: MediaItem) => void | Promise<void>;
  mediaType?: MediaType;
};

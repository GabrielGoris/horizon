import type { MediaItem } from "../../../types";

export type WishlistPriorityDialogProps = {
  collection: MediaItem[];
  item: MediaItem;
  isSaving?: boolean;
  onCancel: () => void;
  onConfirm: (position: number) => void | Promise<void>;
};

export type MediaCoverProps = {
  item: MediaItem;
  className: string;
};

import type { MediaItem } from "../../../../types";
import type { LibraryFilterState } from "../../types";

export type UseFilteredCollectionParams = {
  activeTab: string;
  addedYearFilter: string;
  collection: MediaItem[];
  completedYearFilter: string;
  movieKindFilter: LibraryFilterState["movieKindFilter"];
  searchQuery: string;
  sortMode: LibraryFilterState["sortMode"];
  statusFilter: LibraryFilterState["statusFilter"];
};

export type UseWishlistPriorityParams = {
  collection: MediaItem[];
  refreshMedia: () => Promise<MediaItem[]>;
};
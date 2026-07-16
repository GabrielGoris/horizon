import type { MediaItem } from "../../../../types";
import type { LibraryFilterState } from "../../types";

export type UseFilteredCollectionParams = {
  activeTab: string;
  collection: MediaItem[];
  completedYearFilter: string;
  gamePlatformFilter: LibraryFilterState["gamePlatformFilter"];
  mediaFormatFilter: LibraryFilterState["mediaFormatFilter"];
  searchQuery: string;
  sortMode: LibraryFilterState["sortMode"];
  statusFilter: LibraryFilterState["statusFilter"];
};

export type UseWishlistPriorityParams = {
  collection: MediaItem[];
  refreshMedia: () => Promise<MediaItem[]>;
};

import { getMediaStatusLabel } from "../../../../consts/mediaStatus";
import type { MediaType } from "../../../../types";
import type { GamePlatformFilter, MediaFormatFilter, SortMode, StatusFilter } from "../../types";
import { getSortOptions } from "./sortOptions";

export type LibraryFilterChipId = "status" | "year" | "platform" | "format" | "sort";

export function getLibraryFilterChips(input: {
  activeTab: string;
  completedYear: string;
  mediaFormat: MediaFormatFilter;
  mediaType?: MediaType;
  platform: GamePlatformFilter;
  sortMode: SortMode;
  status: StatusFilter;
}) {
  const chips: Array<{ id: LibraryFilterChipId; label: string }> = [];
  if (input.status !== "all") chips.push({ id: "status", label: getMediaStatusLabel(input.status, input.mediaType) });
  if (input.completedYear) chips.push({ id: "year", label: `Ano: ${input.completedYear}` });
  if (input.platform !== "all") chips.push({ id: "platform", label: input.platform });
  if (input.mediaFormat !== "all") chips.push({ id: "format", label: input.mediaFormat === "movie" ? "Filmes" : "Séries" });
  if (input.sortMode !== "title_asc") chips.push({ id: "sort", label: getSortOptions(input.activeTab).find((option) => option.value === input.sortMode)?.label ?? "Ordenação" });
  return chips;
}

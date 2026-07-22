import type { ReactNode } from "react";

export type GridLayout = {
  columns: number;
  gap: number;
  rowHeight: number;
};

export type RenderRange = {
  endRow: number;
  startRow: number;
};

export interface VirtualMediaGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
}

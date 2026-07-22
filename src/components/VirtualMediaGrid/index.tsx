import { useEffect, useMemo, useRef, useState } from "react";
import type { GridLayout, RenderRange, VirtualMediaGridProps } from "./types";

const OVERSCAN_ROWS = 2;


function getGridLayout(width: number): GridLayout {
  const viewportWidth = window.innerWidth;
  const columns = viewportWidth >= 1024 ? 5 : viewportWidth >= 768 ? 4 : 3;
  const gap = viewportWidth >= 640 ? 24 : 10;
  const cardWidth = Math.max(1, (width - gap * (columns - 1)) / columns);

  return {
    columns,
    gap,
    rowHeight: cardWidth * 1.5 + gap,
  };
}

export function VirtualMediaGrid<T>({ items, renderItem }: VirtualMediaGridProps<T>) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<GridLayout>({ columns: 3, gap: 10, rowHeight: 200 });
  const totalRows = Math.ceil(items.length / layout.columns);
  const [range, setRange] = useState<RenderRange>({ endRow: Math.min(totalRows, 4), startRow: 0 });
  const rangeRef = useRef(range);
  const scrollFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const grid = gridRef.current;

    if (!grid) return;

    const updateLayout = () => {
      const nextLayout = getGridLayout(grid.clientWidth);

      setLayout((current) => (
        current.columns === nextLayout.columns
          && current.gap === nextLayout.gap
          && Math.abs(current.rowHeight - nextLayout.rowHeight) < 1
          ? current
          : nextLayout
      ));
    };

    const frame = window.requestAnimationFrame(updateLayout);
    const observer = new ResizeObserver(updateLayout);
    observer.observe(grid);
    window.addEventListener("resize", updateLayout);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", updateLayout);
    };
  }, []);

  useEffect(() => {
    const grid = gridRef.current;
    const scrollRoot = grid?.closest("main");

    if (!grid || !scrollRoot) return;

    const updateRange = () => {
      const rootRect = scrollRoot.getBoundingClientRect();
      const gridRect = grid.getBoundingClientRect();
      const gridOffset = scrollRoot.scrollTop + gridRect.top - rootRect.top;
      const relativeScrollTop = Math.max(0, scrollRoot.scrollTop - gridOffset);
      const firstVisibleRow = Math.floor(relativeScrollTop / layout.rowHeight);
      const lastVisibleRow = Math.ceil((relativeScrollTop + scrollRoot.clientHeight) / layout.rowHeight);
      const nextRange = {
        startRow: Math.max(0, firstVisibleRow - OVERSCAN_ROWS),
        endRow: Math.min(totalRows, lastVisibleRow + OVERSCAN_ROWS),
      };

      if (
        rangeRef.current.startRow === nextRange.startRow
        && rangeRef.current.endRow === nextRange.endRow
      ) return;

      rangeRef.current = nextRange;
      setRange(nextRange);
    };

    const requestRangeUpdate = () => {
      if (scrollFrameRef.current !== null) return;

      scrollFrameRef.current = window.requestAnimationFrame(() => {
        scrollFrameRef.current = null;
        updateRange();
      });
    };

    const frame = window.requestAnimationFrame(requestRangeUpdate);
    const observer = new ResizeObserver(requestRangeUpdate);
    observer.observe(scrollRoot);
    scrollRoot.addEventListener("scroll", requestRangeUpdate, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      if (scrollFrameRef.current !== null) window.cancelAnimationFrame(scrollFrameRef.current);
      observer.disconnect();
      scrollRoot.removeEventListener("scroll", requestRangeUpdate);
    };
  }, [layout.rowHeight, totalRows]);

  const rows = useMemo(() => {
    const visibleRows = [];

    for (let rowIndex = range.startRow; rowIndex < Math.min(range.endRow, totalRows); rowIndex += 1) {
      const start = rowIndex * layout.columns;
      visibleRows.push({
        items: items.slice(start, start + layout.columns),
        rowIndex,
        start,
      });
    }

    return visibleRows;
  }, [items, layout.columns, range, totalRows]);

  if (!items.length) return null;

  return (
    <div
      ref={gridRef}
      className="relative w-full"
      style={{ height: Math.max(0, totalRows * layout.rowHeight - layout.gap) }}
    >
      {rows.map(({ items: rowItems, rowIndex, start }) => (
        <div
          key={rowIndex}
          className="absolute inset-x-0 grid grid-cols-3 gap-2.5 sm:gap-6 md:grid-cols-4 lg:grid-cols-5"
          style={{ transform: `translateY(${rowIndex * layout.rowHeight}px)` }}
        >
          {rowItems.map((item, index) => renderItem(item, start + index))}
        </div>
      ))}
    </div>
  );
}

import { useEffect, useRef, type PointerEvent, type MouseEvent, type KeyboardEvent } from "react";

export function useLongPress(onHold: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const start = useRef({ x: 0, y: 0 });
  const held = useRef(false);
  const cancel = () => clearTimeout(timer.current);
  useEffect(() => () => clearTimeout(timer.current), []);
  return {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (event.button !== 0 || !event.isPrimary || (event.target as Element).closest("[data-card-action]")) return;
      cancel();
      held.current = false;
      start.current = { x: event.clientX, y: event.clientY };
      event.currentTarget.setPointerCapture?.(event.pointerId);
      timer.current = setTimeout(() => {
        held.current = true;
        navigator.vibrate?.(12);
        onHold();
      }, 500);
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      if (Math.hypot(event.clientX - start.current.x, event.clientY - start.current.y) > 10) cancel();
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      cancel();
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    },
    onPointerCancel: cancel,
    onClickCapture: (event: MouseEvent<HTMLElement>) => {
      if (held.current) { event.preventDefault(); event.stopPropagation(); held.current = false; }
    },
    onContextMenu: (event: MouseEvent<HTMLElement>) => {
      if ((event.target as Element).closest("[data-card-action]")) return;
      event.preventDefault();
      cancel();
      if (!held.current) {
        held.current = true;
        onHold();
      }
    },
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) { event.preventDefault(); onHold(); }
    },
  };
}

import { MoreHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { useLongPress } from "../../hooks/useLongPress";

export function CardActions({ children, title, onOpen }: { children: ReactNode; title: string; onOpen: () => void }) {
  const hold = useLongPress(onOpen);
  return <div {...hold} className="group relative select-none touch-pan-y [-webkit-touch-callout:none] [&>button:first-child]:w-full" onDragStart={(event) => event.preventDefault()}>
    {children}
    <button type="button" data-card-action aria-label={`Ações rápidas: ${title}`} onClick={onOpen} className="absolute right-2 top-2 z-30 rounded-lg border border-white/20 bg-black/80 p-2 text-white opacity-90 transition md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"><MoreHorizontal size={16} /></button>
  </div>;
}

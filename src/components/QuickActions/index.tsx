import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function QuickActions({ title, options, onClose, onOpen }: {
  title: string;
  options: { label: string; selected?: boolean; run: () => void | Promise<void> }[];
  onClose: () => void;
  onOpen: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, []);
  useEffect(() => {
    const back = (event: Event) => { event.preventDefault(); event.stopImmediatePropagation(); if (!busy) onClose(); };
    window.addEventListener("horizon:back", back, true);
    return () => window.removeEventListener("horizon:back", back, true);
  }, [busy, onClose]);
  return createPortal(<div className="fixed inset-0 z-[180] flex items-end justify-center bg-black/70 p-4 sm:items-center" onClick={() => !busy && onClose()}>
    <div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`Ações para ${title}`} onClick={(event) => event.stopPropagation()} onKeyDown={(event) => {
      if (event.key === "Escape" && !busy) onClose();
      if (event.key === "Tab") {
        const buttons = panel.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
        if (!buttons?.length) return;
        if (event.shiftKey && (document.activeElement === buttons[0] || document.activeElement === panel.current)) { event.preventDefault(); buttons[buttons.length - 1].focus(); }
        else if (!event.shiftKey && document.activeElement === buttons[buttons.length - 1]) { event.preventDefault(); buttons[0].focus(); }
      }
    }} className="w-full max-w-sm rounded-xl border border-white/10 bg-[#19191c] p-5 text-white shadow-xl">
      <h2 className="mb-4 font-serif text-xl">{title}</h2>
      <p className="mb-2 text-xs text-neutral-400">Alterar estado</p>
      <div className="flex max-h-[50vh] flex-col gap-2 overflow-auto">{options.map((option) => <button key={option.label} type="button" disabled={busy || option.selected} className="rounded-lg border border-white/10 p-3 text-left text-sm disabled:opacity-50 hover:bg-white/5" onClick={async () => {
        setBusy(true); setError("");
        try { await option.run(); onClose(); } catch { setError("Não foi possível alterar o estado. Tente novamente."); } finally { setBusy(false); }
      }}>{option.label}{option.selected ? " ✓" : ""}</button>)}</div>
      {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
      <div className="mt-4 flex justify-between gap-3"><button type="button" disabled={busy} onClick={onOpen} className="text-sm text-noir-gold">Abrir item</button><button type="button" disabled={busy} onClick={onClose} className="text-sm text-neutral-400">Fechar</button></div>
    </div>
  </div>, document.body);
}

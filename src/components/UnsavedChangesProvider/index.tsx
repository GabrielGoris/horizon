import { AlertTriangle, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { UnsavedChangesContext, type UnsavedEditorState } from "../../contexts/UnsavedChangesContext";

type DiscardRequest = { onDiscard: () => void };

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const editors = useRef(new Map<string, UnsavedEditorState>());
  const dialogRef = useRef<HTMLElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const [request, setRequest] = useState<DiscardRequest | null>(null);

  const registerEditor = useCallback((id: string, state: UnsavedEditorState) => {
    editors.current.set(id, state);
    return () => editors.current.delete(id);
  }, []);

  const requestDiscard = useCallback((onDiscard: () => void) => {
    const states = [...editors.current.values()];
    if (states.some((editor) => editor.busy)) return;
    if (!states.some((editor) => editor.dirty)) {
      onDiscard();
      return;
    }
    setRequest((current) => current ?? { onDiscard });
  }, []);

  const close = useCallback(() => setRequest(null), []);
  const confirm = useCallback(() => {
    if (!request) return;
    const action = request.onDiscard;
    setRequest(null);
    action();
  }, [request]);

  useEffect(() => {
    const handleUnload = (event: BeforeUnloadEvent) => {
      if (![...editors.current.values()].some((editor) => editor.dirty || editor.busy)) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  useEffect(() => {
    if (!request) return;
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>("[data-initial-focus]")?.focus());

    const handleBack = (event: Event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      close();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...(dialogRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])") ?? [])];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("horizon:back", handleBack, true);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("horizon:back", handleBack, true);
      window.removeEventListener("keydown", handleKeyDown);
      previousFocus.current?.focus();
      previousFocus.current = null;
    };
  }, [close, request]);

  const contextValue = useMemo(() => ({ registerEditor, requestDiscard }), [registerEditor, requestDiscard]);

  return (
    <UnsavedChangesContext.Provider value={contextValue}>
      {children}
      {request && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <button type="button" aria-label="Continuar editando" className="absolute inset-0 cursor-default" onClick={close} />
          <section ref={dialogRef} role="alertdialog" aria-modal="true" aria-labelledby="unsaved-title" aria-describedby="unsaved-description" className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#19191c] shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
            <header className="flex items-start justify-between border-b border-white/10 px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-noir-gold/25 bg-noir-gold/10 text-noir-gold"><AlertTriangle size={19} /></span>
                <div>
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-noir-gold">Alterações não salvas</p>
                  <h2 id="unsaved-title" className="mt-1 font-serif text-2xl font-bold italic text-noir-champagne">Descartar alterações?</h2>
                </div>
              </div>
              <button type="button" onClick={close} aria-label="Continuar editando" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-neutral-500 transition hover:text-white"><X size={16} /></button>
            </header>
            <p id="unsaved-description" className="px-6 py-6 text-sm leading-6 text-neutral-400">As informações que você alterou ainda não foram salvas. Se sair agora, essas mudanças serão perdidas.</p>
            <footer className="flex flex-col-reverse gap-3 border-t border-white/10 bg-black/10 px-6 py-4 sm:flex-row sm:justify-end">
              <button type="button" data-initial-focus onClick={close} className="h-10 rounded-lg border border-white/10 px-4 text-xs font-bold text-neutral-300 transition hover:border-white/20 hover:text-white">Continuar editando</button>
              <button type="button" onClick={confirm} className="h-10 rounded-lg border border-red-400/25 bg-red-500/10 px-4 font-mono text-[10px] font-bold uppercase tracking-wider text-red-300 transition hover:bg-red-500/20">Descartar alterações</button>
            </footer>
          </section>
        </div>
      )}
    </UnsavedChangesContext.Provider>
  );
}

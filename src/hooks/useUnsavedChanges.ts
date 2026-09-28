import { useCallback, useContext, useEffect, useId, useState } from "react";
import { UnsavedChangesContext } from "../contexts/UnsavedChangesContext";

function useUnsavedChangesContext() {
  const context = useContext(UnsavedChangesContext);
  if (!context) throw new Error("useUnsavedChanges precisa estar dentro de UnsavedChangesProvider.");
  return context;
}

export function useConfirmUnsavedChanges() {
  return useUnsavedChangesContext().requestDiscard;
}

export function useUnsavedChanges(dirty: boolean, busy: boolean, onDiscard: () => void) {
  const id = useId();
  const { registerEditor, requestDiscard } = useUnsavedChangesContext();
  const requestOwnDiscard = useCallback(() => requestDiscard(onDiscard), [onDiscard, requestDiscard]);
  useEffect(() => {
    const unregister = registerEditor(id, { dirty, busy });
    const back = (event: Event) => {
      if (!dirty && !busy) return;
      event.preventDefault(); event.stopImmediatePropagation();
      requestOwnDiscard();
    };
    window.addEventListener("horizon:back", back, true);
    return () => { unregister(); window.removeEventListener("horizon:back", back, true); };
  }, [id, dirty, busy, registerEditor, requestOwnDiscard]);
  return requestOwnDiscard;
}

export function useDraftSnapshot(value: unknown) {
  const [initial] = useState(() => JSON.stringify(value));
  return initial !== JSON.stringify(value);
}

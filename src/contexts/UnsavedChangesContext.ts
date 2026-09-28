import { createContext } from "react";

export type UnsavedEditorState = { busy: boolean; dirty: boolean };

export interface UnsavedChangesContextValue {
  registerEditor: (id: string, state: UnsavedEditorState) => () => void;
  requestDiscard: (onDiscard: () => void) => void;
}

export const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(null);

import type { ToastAction, ToastInput, ToastItem, ToastTone } from "../types";

export const MAX_VISIBLE_TOASTS = 4;

const DEFAULT_TITLES: Record<ToastTone, string> = {
  success: "Tudo certo",
  error: "Algo deu errado",
  warning: "Atenção",
  info: "Informação",
};

export function createToastItem(input: ToastInput | string, id: string): ToastItem {
  const normalizedInput = typeof input === "string" ? { message: input } : input;
  const tone = normalizedInput.tone ?? "info";

  return {
    id,
    message: normalizedInput.message,
    title: normalizedInput.title ?? DEFAULT_TITLES[tone],
    tone,
    durationMs: normalizedInput.durationMs,
  };
}

export function toastReducer(state: ToastItem[], action: ToastAction): ToastItem[] {
  if (action.type === "dismiss") return state.filter((toast) => toast.id !== action.id);
  if (action.type === "clear") return [];

  return [...state.filter((toast) => toast.id !== action.toast.id), action.toast].slice(-MAX_VISIBLE_TOASTS);
}

export type ToastTone = "success" | "error" | "warning" | "info";

export interface ToastActionButton {
  label: string;
  onAction: () => void;
}

export interface ToastInput {
  action?: ToastActionButton;
  message: string;
  title?: string;
  tone?: ToastTone;
  durationMs?: number;
}

export interface ToastItem extends Required<Pick<ToastInput, "message" | "tone">> {
  action?: ToastActionButton;
  id: string;
  title: string;
  durationMs?: number;
}

export type ToastAction =
  | { type: "add"; toast: ToastItem }
  | { type: "dismiss"; id: string }
  | { type: "clear" };

export interface ToastContextValue {
  dismiss: (id: string) => void;
  notify: (toast: ToastInput | string) => string;
}

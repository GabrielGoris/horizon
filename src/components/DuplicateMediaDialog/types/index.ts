import type { ReactNode } from "react";

export type DuplicateMediaDialogProps = {
  cover?: string;
  confirmLabel?: string;
  description?: ReactNode;
  heading?: string;
  isConfirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
};

export type DuplicateMediaDialogProps = {
  cover?: string;
  isConfirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
};

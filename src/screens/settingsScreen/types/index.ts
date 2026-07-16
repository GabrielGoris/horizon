import type { Session } from '@supabase/supabase-js';
import type { ReactNode } from 'react';

export interface SettingsScreenProps {
  onSignOut: () => void | Promise<void>;
  session: Session;
}

export type AccountSettingsProps = {
  onOpenDelete: () => void;
  onSignOut: () => void | Promise<void>;
  userEmail: string;
};

export type SettingsRowProps = {
  action?: ReactNode;
  description: string;
  label: string;
  value?: string;
};

export type DeleteAccountDialogProps = {
  errorMessage: string | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: (email: string, password: string) => void | Promise<void>;
  userEmail: string;
};

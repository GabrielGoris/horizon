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
  captchaResetKey: number;
  errorMessage: string | null;
  isDeleting: boolean;
  isSocialReauthenticated: boolean;
  onCancel: () => void;
  onConfirm: (password: string, captchaToken: string | null) => void | Promise<void>;
  onSocialReauthenticate: () => void | Promise<void>;
  requiresPassword: boolean;
  userEmail: string;
};

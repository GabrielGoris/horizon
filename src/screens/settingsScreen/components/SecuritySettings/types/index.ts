import type { Session } from '@supabase/supabase-js';

export type SecuritySettingsProps = {
  session: Session;
};

export type TotpEnrollment = {
  factorId: string;
  qrCode: string;
  secret: string;
};

export type SecurityPasswordInputProps = {
  autoComplete: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
};

export type SecurityFeedbackProps = {
  error: string | null;
  feedback: string | null;
};

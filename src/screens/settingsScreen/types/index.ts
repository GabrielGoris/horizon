import type { Session } from '@supabase/supabase-js';

export interface SettingsScreenProps {
  onSignOut: () => void;
  session: Session;
}

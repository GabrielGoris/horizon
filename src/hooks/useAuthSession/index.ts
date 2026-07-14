import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) return;

        setSession(error ? null : data.session);
        setIsLoadingSession(false);
      })
      .catch(() => {
        if (!isMounted) return;

        setSession(null);
        setIsLoadingSession(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoadingSession(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    isLoadingSession,
    session,
  };
}

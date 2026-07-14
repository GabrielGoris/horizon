import type { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type MfaCheck = {
  accessToken: string
  isRequired: boolean
}

export function useMfaAssurance(session: Session | null) {
  const [mfaCheck, setMfaCheck] = useState<MfaCheck | null>(null)

  useEffect(() => {
    let isMounted = true

    if (!session) return

    void supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data, error }) => {
      if (!isMounted) return

      setMfaCheck({
        accessToken: session.access_token,
        isRequired: !error && data.nextLevel === 'aal2' && data.currentLevel !== 'aal2',
      })
    })

    return () => {
      isMounted = false
    }
  }, [session])

  const isCheckingMfa = Boolean(session && mfaCheck?.accessToken !== session.access_token)
  const isMfaRequired = Boolean(session && mfaCheck?.accessToken === session.access_token && mfaCheck.isRequired)

  return {
    isCheckingMfa,
    isMfaRequired,
    resetMfaCheck: () => setMfaCheck(null),
  }
}

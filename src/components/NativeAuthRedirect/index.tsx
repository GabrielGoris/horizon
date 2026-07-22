import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export function NativeAuthRedirect() {
  const navigate = useNavigate()
  const handledUrlsRef = useRef(new Set<string>())

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const handleUrl = async (url: string) => {
      if (handledUrlsRef.current.has(url)) return

      const redirect = new URL(url)
      if (redirect.protocol !== 'horizon:' || redirect.host !== 'auth') return
      handledUrlsRef.current.add(url)

      const code = redirect.searchParams.get('code')
      const hash = new URLSearchParams(redirect.hash.replace(/^#/, ''))
      const authError = redirect.searchParams.get('error_description') ?? hash.get('error_description')
      const accessToken = hash.get('access_token')
      const refreshToken = hash.get('refresh_token')

      if (authError) {
        navigate(`/auth/callback?error_description=${encodeURIComponent(authError)}`, { replace: true })
        return
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          navigate(`/auth/callback?error_description=${encodeURIComponent(error.message)}`, { replace: true })
          return
        }
      }

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        if (error) {
          navigate(`/auth/callback?error_description=${encodeURIComponent(error.message)}`, { replace: true })
          return
        }
      }

      navigate(redirect.pathname === '/reset-password' ? '/auth/reset-password' : '/auth/callback', { replace: true })
    }

    const listener = CapacitorApp.addListener('appUrlOpen', ({ url }) => {
      void handleUrl(url)
    })

    void CapacitorApp.getLaunchUrl().then((launchUrl) => {
      if (launchUrl?.url) void handleUrl(launchUrl.url)
    })

    return () => {
      void listener.then((handle) => handle.remove())
    }
  }, [navigate])

  return null
}

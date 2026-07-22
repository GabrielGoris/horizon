import { Capacitor } from '@capacitor/core'

const nativeAuthBaseUrl = 'horizon://auth'

export function getAuthRedirectUrl(path = 'callback') {
  if (Capacitor.isNativePlatform()) return `${nativeAuthBaseUrl}/${path}`

  return `${window.location.origin}/auth/${path}`
}

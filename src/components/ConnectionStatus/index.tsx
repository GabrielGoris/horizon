import { CloudOff } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const setOnline = () => setIsOnline(true)
    const setOffline = () => setIsOnline(false)

    window.addEventListener('online', setOnline)
    window.addEventListener('offline', setOffline)

    return () => {
      window.removeEventListener('online', setOnline)
      window.removeEventListener('offline', setOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div role="status" className="fixed left-1/2 top-3 z-[90] flex -translate-x-1/2 items-center gap-2 rounded-full border border-noir-gold/25 bg-[#1a1a1e]/95 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-noir-champagne shadow-xl">
      <CloudOff size={13} className="text-noir-gold" />
      Modo offline
    </div>
  )
}

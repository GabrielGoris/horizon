import { Bell, CreditCard, Menu, Plug, Shield, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import type { HeaderProps } from './types'

const IconSearch = ({ className = 'w-4 h-4' }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
const IconPlus = ({ className = 'w-4 h-4' }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>

const accountLinks = [
  { label: 'Conta', to: '/settings', icon: <UserRound size={15} /> },
  { label: 'Segurança', to: '/settings/security', icon: <Shield size={15} /> },
  { label: 'Integrações', to: '/settings/integrations', icon: <Plug size={15} /> },
  { label: 'Notificações', to: '/settings/notifications', icon: <Bell size={15} /> },
  { label: 'Plano', to: '/settings/billing', icon: <CreditCard size={15} /> },
]

export function Header({ addLabel = 'Adicionar obra', searchPlaceholder = 'Buscar obras na biblioteca...', searchQuery, onSearchChange, onAddClick, onMobileMenuClick, userEmail }: HeaderProps) {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const accountInitial = userEmail?.trim().charAt(0).toUpperCase()

  useEffect(() => {
    if (!isAccountMenuOpen) return undefined

    const handlePointerDown = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) setIsAccountMenuOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isAccountMenuOpen])

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-start gap-3 border-b border-white/5 bg-[#131315] px-4 md:bg-[#131315]/90 md:backdrop-blur-md sm:h-20 sm:px-8 lg:px-10">
      {onMobileMenuClick && <button type="button" aria-label="Abrir menu" onClick={onMobileMenuClick} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-transparent text-neutral-400 transition hover:border-white/10 hover:bg-white/[0.04] hover:text-noir-champagne md:hidden"><Menu size={20} /></button>}

      <div className="relative min-w-0 flex-1 sm:w-96 sm:flex-none">
        <IconSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
        <input type="text" placeholder={searchPlaceholder} value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} className="w-full rounded-full border border-white/5 bg-[#18181c] py-2.5 pl-11 pr-4 text-xs text-white outline-none transition-all placeholder:text-neutral-600 focus:border-[#d4af37]" />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-3">
        <button type="button" onClick={onAddClick} aria-label={addLabel} className="hidden shrink-0 items-center justify-center gap-2 rounded-full bg-[#d4af37] px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-black shadow-lg shadow-[#d4af37]/10 transition-all hover:bg-white md:flex"><IconPlus className="h-4 w-4" /> {addLabel}</button>

        <div ref={accountMenuRef} className="relative shrink-0">
          <button type="button" onClick={() => setIsAccountMenuOpen((current) => !current)} aria-label="Abrir opções da conta" aria-expanded={isAccountMenuOpen} title={userEmail ?? 'Conta'} className="flex h-10 w-10 items-center justify-center rounded-full border border-noir-gold/30 bg-noir-gold/10 text-sm font-bold text-noir-champagne transition hover:border-noir-gold hover:bg-noir-gold/20">{accountInitial ?? <UserRound size={18} />}</button>
          {isAccountMenuOpen && (
            <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-64 overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1e] p-2 shadow-2xl shadow-black/60">
              <div className="border-b border-white/5 px-3 pb-3 pt-2"><p className="truncate text-sm font-bold text-white">{userEmail ?? 'Conta Horizon'}</p><p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-neutral-500">Configurações</p></div>
              <nav className="mt-2 flex flex-col gap-1" aria-label="Opções da conta">
                {accountLinks.map((link) => <NavLink key={link.to} to={link.to} onClick={() => setIsAccountMenuOpen(false)} className={({ isActive }) => `flex h-10 items-center gap-3 rounded-lg px-3 text-[11px] font-bold uppercase tracking-wide transition ${isActive ? 'bg-noir-gold/10 text-noir-champagne' : 'text-neutral-500 hover:bg-white/[0.04] hover:text-white'}`}>{link.icon}<span>{link.label}</span></NavLink>)}
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

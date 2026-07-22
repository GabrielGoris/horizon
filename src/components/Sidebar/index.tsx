import { LayoutGrid, Plus, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { CustomCategoryIcon } from '../CustomCategoryIcon'
import { SidebarItem } from './SideBarItem'
import type { SidebarProps } from './types'

export function Sidebar({ categories, customCategories = [], isMobileMenuOpen, onAddCategory, onMobileMenuOpenChange }: SidebarProps) {
  return (
    <>
      <aside className="hidden h-screen w-[324px] shrink-0 flex-col border-r border-white/5 bg-noir-base px-[34px] pb-2 pt-9 md:flex">
        <div className="flex min-h-0 flex-1 flex-col gap-[66px]">
          <div className="flex items-center gap-2">
            <span className="font-serif text-[31px] font-extrabold italic leading-none text-noir-champagne lowercase">horizon<span className="text-noir-gold">.</span></span>
            <span className="mt-1 rounded border border-noir-gold/25 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.24em] text-noir-gold/70">Noir</span>
          </div>

          <nav className="flex min-h-0 flex-1 flex-col gap-[14px] overflow-y-auto pr-1 [scrollbar-width:thin]" aria-label="Biblioteca">
            <span className="mb-1 ml-4 shrink-0 text-[10px] font-bold uppercase tracking-[0.28em] text-neutral-600">Biblioteca</span>
            <SidebarItem label="Visão Geral" icon={<LayoutGrid size={15} strokeWidth={2.3} />} to="/" end activeVariant="primary" />
            {categories.map((category) => <SidebarItem key={category.id} label={category.plural} icon={category.icon} to={`/${category.id}`} />)}

            <span className="mb-1 ml-4 mt-5 flex shrink-0 items-center justify-between text-[10px] font-bold uppercase tracking-[0.28em] text-neutral-600">
              Minhas categorias
              {onAddCategory && <button type="button" aria-label="Adicionar categoria" onClick={onAddCategory} className="mr-2 flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-neutral-500 transition hover:border-noir-gold/30 hover:text-noir-gold"><Plus size={13} /></button>}
            </span>
            {customCategories.map((category) => <SidebarItem key={category.id} label={category.name_plural} icon={<CustomCategoryIcon name={category.icon} size={15} />} to={`/c/${category.slug}`} />)}
          </nav>
        </div>

      </aside>

      <MobileNavigation categories={categories} customCategories={customCategories} isMobileMenuOpen={isMobileMenuOpen} onAddCategory={onAddCategory} onMobileMenuOpenChange={onMobileMenuOpenChange} />
    </>
  )
}

export function MobileNavigation({ categories, customCategories = [], isMobileMenuOpen = false, onAddCategory, onMobileMenuOpenChange }: SidebarProps) {
  const closeMenu = () => onMobileMenuOpenChange?.(false)

  return (
    <>
      <nav aria-label="Bibliotecas" className="fixed inset-x-0 bottom-0 z-40 flex h-[calc(4.5rem+env(safe-area-inset-bottom))] items-start justify-around border-t border-white/10 bg-[#131315]/95 px-1 pt-2 backdrop-blur-xl md:hidden">
        <MobileLink label="Início" to="/" icon={<LayoutGrid size={19} />} end />
        {categories.map((category) => <MobileLink key={category.id} label={category.plural.split(' ')[0]} to={`/${category.id}`} icon={category.icon} />)}
      </nav>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm md:hidden" onClick={closeMenu}>
          <section aria-label="Menu principal" className="absolute inset-y-0 left-0 flex w-[min(21rem,86vw)] flex-col overflow-y-auto border-r border-white/10 bg-[#171719] px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5 shadow-[24px_0_70px_rgba(0,0,0,0.6)]" onClick={(event) => event.stopPropagation()}>
            <div className="mb-10 flex items-center justify-between">
              <span className="font-serif text-[30px] font-extrabold italic leading-none text-noir-champagne lowercase">horizon<span className="text-noir-gold">.</span></span>
              <button type="button" onClick={closeMenu} aria-label="Fechar menu" className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-neutral-400 transition hover:bg-white/[0.04] hover:text-white"><X size={18} /></button>
            </div>
            {customCategories.length > 0 && <p className="mt-6 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-neutral-500">Minhas categorias</p>}
            {customCategories.length > 0 && <div className="mt-3 grid grid-cols-2 gap-2">{customCategories.map((category) => <MenuLink key={category.id} label={category.name_plural} to={`/c/${category.slug}`} icon={<CustomCategoryIcon name={category.icon} size={18} />} onSelect={closeMenu} />)}</div>}
            {onAddCategory && <button type="button" onClick={() => { closeMenu(); onAddCategory() }} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-noir-gold/25 bg-noir-gold/10 px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-noir-champagne"><Plus size={15} /> Nova categoria</button>}
          </section>
        </div>
      )}
    </>
  )
}

function MobileLink({ end, icon, label, to }: { end?: boolean; icon: ReactNode; label: string; to: string }) {
  return <NavLink to={to} end={end} className={({ isActive }) => `flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-1 text-[9px] font-semibold ${isActive ? 'text-noir-gold' : 'text-neutral-500'}`}>{icon}<span className="max-w-full truncate">{label}</span></NavLink>
}

function MenuLink({ icon, label, onSelect, to }: { icon: ReactNode; label: string; onSelect: () => void; to: string }) {
  return <NavLink to={to} onClick={onSelect} className="flex min-h-16 items-center gap-3 rounded-xl border border-white/10 bg-black/10 px-3 text-sm font-semibold text-neutral-200"><span className="text-noir-gold">{icon}</span><span className="line-clamp-2">{label}</span></NavLink>
}

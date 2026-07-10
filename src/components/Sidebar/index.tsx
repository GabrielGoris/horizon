import { LayoutGrid, LogOut } from 'lucide-react';
import { SidebarItem } from './SideBarItem';
import type { SidebarProps } from './types';

export function Sidebar({ categories, onSignOut, userEmail }: SidebarProps) {
  return (
    <aside className="flex h-screen w-[324px] shrink-0 flex-col justify-between border-r border-white/5 bg-noir-base px-[34px] py-9">
      <div className="flex flex-col gap-[66px]">
        <div className="flex items-center gap-2">
          <span className="font-serif text-[31px] font-extrabold italic leading-none text-noir-champagne lowercase">
            horizon<span className="text-noir-gold">.</span>
          </span>
          <span className="mt-1 rounded border border-noir-gold/25 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.24em] text-noir-gold/70">
            Noir
          </span>
        </div>

        <nav className="flex flex-col gap-[14px]" aria-label="Biblioteca">
          <span className="mb-1 ml-4 text-[10px] font-bold uppercase tracking-[0.28em] text-neutral-600">
            Biblioteca
          </span>

          <SidebarItem
            label="Visão Geral"
            icon={<LayoutGrid size={15} strokeWidth={2.3} />}
            to="/"
            end
            activeVariant="primary"
          />

          {categories.map((category) => (
            <SidebarItem
              key={category.id}
              label={category.plural}
              icon={category.icon}
              to={`/${category.id}`}
            />
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-4 border-t border-white/5 pt-5">
        {userEmail && (
          <div className="min-w-0">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-neutral-600">
              Conta
            </p>
            <p className="mt-2 truncate text-xs font-semibold text-neutral-400">{userEmail}</p>
          </div>
        )}
        <button
          type="button"
          onClick={onSignOut}
          className="flex h-11 items-center gap-3 rounded-lg px-[18px] text-[12px] font-semibold uppercase tracking-[0.07em] text-neutral-500 transition-colors hover:bg-white/[0.035] hover:text-noir-champagne"
        >
          <LogOut size={15} strokeWidth={2.3} />
          Sair
        </button>
      </div>
    </aside>
  );
}

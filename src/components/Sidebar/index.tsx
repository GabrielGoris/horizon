import { LayoutGrid, Plus, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { CustomCategoryIcon } from '../CustomCategoryIcon';
import { SidebarItem } from './SideBarItem';
import type { SidebarProps } from './types';

export function Sidebar({ categories, customCategories = [], onAddCategory }: SidebarProps) {
  return (
    <aside className="flex h-screen w-[324px] shrink-0 flex-col justify-between border-r border-white/5 bg-noir-base px-[34px] py-9">
      <div className="flex min-h-0 flex-1 flex-col gap-[66px]">
        <div className="flex items-center gap-2">
          <span className="font-serif text-[31px] font-extrabold italic leading-none text-noir-champagne lowercase">
            horizon<span className="text-noir-gold">.</span>
          </span>
          <span className="mt-1 rounded border border-noir-gold/25 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.24em] text-noir-gold/70">
            Noir
          </span>
        </div>

        <nav className="flex min-h-0 flex-col gap-[14px] overflow-y-auto pr-1 [scrollbar-width:thin]" aria-label="Biblioteca">
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

          <span className="mb-1 ml-4 mt-5 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.28em] text-neutral-600">
            Minhas categorias
            {onAddCategory && (
              <button type="button" aria-label="Adicionar categoria" onClick={onAddCategory} className="mr-2 flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-neutral-500 transition hover:border-noir-gold/30 hover:text-noir-gold">
                <Plus size={13} />
              </button>
            )}
          </span>

          {customCategories.map((category) => (
            <SidebarItem
              key={category.id}
              label={category.name_plural}
              icon={<CustomCategoryIcon name={category.icon} size={15} />}
              to={`/c/${category.slug}`}
            />
          ))}

        </nav>
      </div>

      <NavLink
        to="/settings"
        aria-label="Configurações"
        className={({ isActive }) =>
          `flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
            isActive
              ? 'border-noir-gold/45 bg-noir-gold/15 text-noir-gold'
              : 'border-white/5 bg-white/[0.025] text-neutral-500 hover:bg-white/[0.05] hover:text-noir-champagne'
          }`
        }
      >
        <Settings size={16} strokeWidth={2.2} />
      </NavLink>
    </aside>
  );
}

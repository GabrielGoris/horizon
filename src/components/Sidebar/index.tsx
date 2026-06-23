import { LayoutGrid, Plus } from 'lucide-react';
import { SidebarItem } from './SideBarItem';
import type { SidebarProps } from './types';

export function Sidebar({ categories, activeTab, setActiveTab, onAddCategory }: SidebarProps) {
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
            isActive={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            activeVariant="primary"
          />

          {categories.map((category) => (
            <SidebarItem
              key={category.id}
              label={category.plural}
              icon={category.icon}
              isActive={activeTab === category.id}
              onClick={() => setActiveTab(category.id)}
            />
          ))}

          {onAddCategory && (
            <button
              type="button"
              onClick={onAddCategory}
              className="mt-6 flex h-[52px] w-full items-center gap-3 rounded-lg border border-dashed border-white/10 px-[18px] text-[12px] font-bold uppercase tracking-[0.07em] text-noir-gold/70 transition-all hover:border-noir-gold/30 hover:bg-noir-gold/5 hover:text-noir-gold"
            >
              <Plus size={15} />
              <span>Nova Categoria</span>
            </button>
          )}
        </nav>
      </div>
    </aside>
  );
}

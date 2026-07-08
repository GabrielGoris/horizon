import { Link } from "react-router-dom";
import { MediaCard } from "../../../../components/MediaCard";
import { CATEGORIES } from "../../consts";
import type { OverviewSectionProps } from "../types";


export function OverviewSection({ priorityItemsByCategory, onManageWishlist, onPrioritizeMedia, onSelectMedia }: OverviewSectionProps) {
  const hasPriorityItems = Array.from(priorityItemsByCategory.values()).some((items) => items.length > 0);

  return (
    <div className="flex flex-col gap-12">
      <div className="border-b border-white/5 pb-4">
        <h2 className="font-serif text-3xl font-extrabold text-white">
          Visao Geral do Acervo
        </h2>
        <p className="mt-1 text-sm text-neutral-500">O que esta no seu radar no momento.</p>
      </div>

      {!hasPriorityItems && (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
          <p>Nenhuma obra na lista de prioridade.</p>
        </div>
      )}

      {CATEGORIES.map((category) => {
        const categoryItems = priorityItemsByCategory.get(category.id) ?? [];

        if (categoryItems.length === 0) return null;

        return (
          <section key={category.id}>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-serif text-xl font-bold text-[#ebdcb9]">
                Top 5 {category.plural}
              </h3>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => onManageWishlist(category.id)}
                  className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 transition-colors hover:text-noir-gold"
                >
                  Gerenciar lista
                </button>
                <Link
                  to={`/${category.id}`}
                  className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 transition-colors hover:text-noir-gold"
                >
                  Ver Tudo
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-5">
              {categoryItems.map((item, index) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  rank={index + 1}
                  onClick={onSelectMedia}
                  onPrioritize={onPrioritizeMedia}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

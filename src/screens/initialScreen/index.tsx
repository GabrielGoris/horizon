import { useState, useMemo } from "react";
import { Header } from "../../components/Header";
import { Sidebar } from "../../components/Sidebar";
import { MediaCard } from "../../components/MediaCard";
import { CATEGORIES } from "./consts";
import type { MediaItem } from "../../types";

const COLLECTION: MediaItem[] = [
  {
    id: '1', title: 'Elden Ring: Shadow of the Erdtree', creator: 'FromSoftware', category: 'Action RPG',
    cover: 'https://cdng.europosters.eu/pod_public/1300/230646.jpg',
    type: 'games', status: 'new', releaseYear: '2024', meta: 'Souls-like', rating: '98',
    description: 'Erga-se, Maculado, nas Terras das Sombras. Uma expansão monumental que redefine o desafio brutal.',
    progress: { current: 48, total: 120, unit: 'horas' }
  },
  {
    id: '2', title: 'Duna: Parte Dois', creator: 'Denis Villeneuve', category: 'Ficção Científica',
    cover: 'https://br.web.img3.acsta.net/c_310_420/pictures/23/05/26/17/47/1900372.jpg',
    type: 'movies', status: 'complete', releaseYear: '2024', meta: 'Épico', rating: '8.8',
    description: 'A jornada mística de Paul Atreides no planeta desértico de Arrakis.'
  },
  {
    id: '3', title: 'Neuromancer', creator: 'William Gibson', category: 'Cyberpunk',
    cover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-dxQUCPzivqlbDtds4Mo0R8iDcKAKKq5zKXFeHEIC5PrvjO2Hdblb-xB2asumZk8pZF3tgX7EMZXAb21nJdIWilkT7KQNhOAEoGyrKw&s=10',
    type: 'books', status: 'reading', releaseYear: '1984', meta: 'Clássico', rating: '5.0',
    description: 'O hacker Case navega pela inteligência artificial e os submundos do ciberespaço.',
    progress: { current: 150, total: 300, unit: 'páginas' }
  }
];

export function InitialScreen() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const activeCategory = CATEGORIES.find((category) => category.id === activeTab);
  const activeLabel = activeTab === 'overview' ? 'Visão Geral' : activeCategory?.plural ?? 'Nova Categoria';

  const filteredCollection = useMemo(() => {
    return COLLECTION.filter(item => {
      const matchesTab = activeTab === 'overview' || item.type === activeTab;
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchQuery]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-noir-base font-sans text-white">
      <Sidebar
        categories={CATEGORIES}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onAddCategory={() => setActiveTab('new-category')}
      />

      <div className="relative flex h-screen flex-1 flex-col">
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddClick={() => setActiveTab('new-item')}
        />

        <main className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 pb-10">
          
           {activeTab === 'overview' && (
          <div className="flex flex-col gap-12">
            <div className="border-b border-white/5 pb-4">
              <h2 className="font-serif text-3xl font-extrabold text-white">
                Visão Geral do Acervo
              </h2>
              <p className="mt-1 text-sm text-neutral-500">O que está no seu radar no momento.</p>
            </div>

            {/* AVISO DE DEBUG SE TUDO ESTIVER VAZIO */}
            {filteredCollection.length === 0 && (
               <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
                 <p>Nenhuma obra encontrada.</p>
                 <p className="text-xs">Verifique se os IDs do CATEGORIES batem com os types do MOCK.</p>
               </div>
            )}

            {CATEGORIES.map(category => {
              const categoryItems = filteredCollection
                .filter(item => item.type === category.id)
                .slice(0, 5);
              
              if (categoryItems.length === 0) return null; 


                  return (
                    <section key={category.id}>
                      <div className="mb-6 flex items-center justify-between">
                        <h3 className="flex items-center gap-2 font-serif text-xl font-bold text-[#ebdcb9]">
                          Top 5 {category.plural}
                        </h3>
                        <button 
                          onClick={() => setActiveTab(category.id)} 
                          className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 transition-colors hover:text-noir-gold"
                        >
                          Ver Tudo →
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-5">
                        {categoryItems.map((item, index) => (
                          <MediaCard 
                            key={item.id} 
                            item={item} 
                            rank={index + 1} 
                            onClick={(clickedItem) => console.log("Obra clicada:", clickedItem.title)} 
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}

            {activeTab !== 'overview' && (
              <section>
                <div className="mb-8 flex items-center justify-between border-b border-white/5 pb-4">
                  <h3 className="font-serif text-2xl font-bold italic tracking-normal text-white">
                    {activeLabel}
                  </h3>
                  <span className="rounded border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-neutral-500">
                    {filteredCollection.length} itens catalogados
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-5">
                  {filteredCollection.map((item) => (
                    <MediaCard 
                      key={item.id}
                      item={item} 
                      onClick={(clickedItem) => console.log("Obra clicada:", clickedItem.title)} 
                    />
                  ))}
                </div>
              </section>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
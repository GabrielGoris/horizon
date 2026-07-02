import { useState, useMemo, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Header } from "../../components/Header";
import { Sidebar } from "../../components/Sidebar";
import { MediaCard } from "../../components/MediaCard";
import { MediaDossier } from "../../components/MediaDossier";
import { CATEGORIES } from "./consts";
import type { BookCompletionDTO, GameCompletionDTO, MovieTicketDTO } from "../../schemas/media";
import type { MediaItem } from "../../types";
import { AddMediaDialog } from "../../components/AddMediaDialog";
import {
  applyBookCompletion,
  applyGameCompletion,
  applyMovieTicket,
  completeMedia,
  deleteMedia,
  fetchMedia,
  markMediaAsComplete,
  saveBookCompletion,
  saveGameCompletion,
  saveMovieTicket,
} from "../../services/mediaService";


interface InitialScreenProps {
  activeTab: string;
}


export function InitialScreen({ activeTab }: InitialScreenProps) {
  const [collection, setCollection] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddMediaModalOpen, setIsAddMediaModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  const activeCategory = CATEGORIES.find((category) => category.id === activeTab);
  const activeLabel = activeTab === 'overview' ? 'Visão Geral' : activeCategory?.plural ?? 'Nova Categoria';

  useEffect(() => {
    let isMounted = true;

    fetchMedia()
      .then((media) => {
        if (isMounted) {
          setCollection(media);
        }
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      isMounted = false;
    };
  }, []); 

  const refreshMedia = useCallback(async () => {
    const media = await fetchMedia();

    setCollection(media);
  }, []);

  const handleCompleteMedia = useCallback(async (item: MediaItem) => {
    try {
      await completeMedia(item.id);
    } catch (error) {
      console.error(error);
      alert('Erro ao concluir a obra.');
      return;
    }

    const completedMedia = markMediaAsComplete(item);

    setCollection((currentCollection) =>
      currentCollection.map((media) => (media.id === item.id ? completedMedia : media))
    );

    setSelectedMedia(completedMedia);
  }, []);

  const handleSaveMovieTicket = useCallback(async (item: MediaItem, ticket: MovieTicketDTO) => {
    try {
      await saveMovieTicket(item.id, ticket);
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar o ticket.');
      return;
    }

    const updatedMedia = applyMovieTicket(item, ticket);

    setCollection((currentCollection) =>
      currentCollection.map((media) => (media.id === item.id ? updatedMedia : media))
    );
    setSelectedMedia(updatedMedia);
  }, []);

  const handleSaveBookCompletion = useCallback(async (item: MediaItem, completion: BookCompletionDTO) => {
    try {
      await saveBookCompletion(item.id, completion);
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar a leitura.');
      return;
    }

    const updatedMedia = applyBookCompletion(item, completion);

    setCollection((currentCollection) =>
      currentCollection.map((media) => (media.id === item.id ? updatedMedia : media))
    );
    setSelectedMedia(updatedMedia);
  }, []);

  const handleSaveGameCompletion = useCallback(async (item: MediaItem, completion: GameCompletionDTO) => {
    try {
      await saveGameCompletion(item.id, completion);
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar o save.');
      return;
    }

    const updatedMedia = applyGameCompletion(item, completion);

    setCollection((currentCollection) =>
      currentCollection.map((media) => (media.id === item.id ? updatedMedia : media))
    );
    setSelectedMedia(updatedMedia);
  }, []);

  const handleDeleteMedia = useCallback(async (item: MediaItem) => {
    const shouldDelete = window.confirm(`Excluir "${item.title}" da biblioteca?`);

    if (!shouldDelete) return;

    try {
      await deleteMedia(item.id);
    } catch (error) {
      console.error(error);
      alert('Erro ao excluir a obra.');
      return;
    }

    setSelectedMedia(null);
    await refreshMedia();
  }, [refreshMedia]);

  const filteredCollection = useMemo(() => {
    return collection.filter((item) => {
      const matchesTab = activeTab === 'overview' || item.type === activeTab;
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [collection, activeTab, searchQuery]);


  return (
    <div className="flex h-screen w-full overflow-hidden bg-noir-base font-sans text-white">
      <Sidebar
        categories={CATEGORIES}
      />

      <div className="relative flex h-screen flex-1 flex-col">
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddClick={() => setIsAddMediaModalOpen(true)}
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

            {filteredCollection.length === 0 && (
               <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
                 <p>Nenhuma obra encontrada.</p>
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
                        <Link 
                          to={`/${category.id}`}
                          className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 transition-colors hover:text-noir-gold"
                        >
                          Ver Tudo →
                        </Link>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-5">
                        {categoryItems.map((item, index) => (
                          <MediaCard 
                            key={item.id} 
                            item={item} 
                            rank={index + 1} 
                            onClick={setSelectedMedia} 
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
                      onClick={setSelectedMedia} 
                    />
                  ))}
                </div>
              </section>
            )}

          </div>
        </main>
      </div>
      <AddMediaDialog
        isOpen={isAddMediaModalOpen}
        onClose={() => setIsAddMediaModalOpen(false)}
        onSuccess={refreshMedia}
      />
      {selectedMedia && (
        <MediaDossier
          item={selectedMedia}
          onClose={() => setSelectedMedia(null)}
          onComplete={handleCompleteMedia}
          onDelete={handleDeleteMedia}
          onSaveTicket={handleSaveMovieTicket}
          onSaveBookCompletion={handleSaveBookCompletion}
          onSaveGameCompletion={handleSaveGameCompletion}
        />
      )}
    </div>
  );
}

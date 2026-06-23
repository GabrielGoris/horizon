import { useState } from "react";
import { Header } from "../../components/Header";
import { Sidebar } from "../../components/Sidebar";
import { CATEGORIES } from "./consts";

export function InitialScreen() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const activeCategory = CATEGORIES.find((category) => category.id === activeTab);
  const activeLabel = activeTab === 'overview' ? 'Visão Geral' : activeCategory?.plural ?? 'Nova Categoria';

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
          <h1 className="font-serif text-2xl text-white">
            Área de testes. Aba ativa: <span className="font-bold text-noir-gold">{activeLabel}</span>
          </h1>
        </main>
      </div>
    </div>
  );
}

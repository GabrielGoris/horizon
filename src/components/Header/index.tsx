import type { HeaderProps } from "./types";

const IconSearch = ({ className = "w-4 h-4" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const IconPlus = ({ className = "w-4 h-4" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;

export function Header({ searchQuery, onSearchChange, onAddClick }: HeaderProps) {
  return (
    <header className="h-20 border-b border-white/5 px-10 flex items-center justify-between shrink-0 bg-[#131315]/90 backdrop-blur-md sticky top-0 z-30">
      
      <div className="relative w-96">
        <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4" />
        <input 
          type="text" 
          placeholder="Buscar obras na biblioteca..." 
          value={searchQuery} 
          onChange={(e) => onSearchChange(e.target.value)} 
          className="w-full bg-[#18181c] border border-white/5 text-white placeholder:text-neutral-600 pl-11 pr-4 py-2.5 rounded-full outline-none text-xs focus:border-[#d4af37] transition-all font-sans"
        />
      </div>

      <button 
        onClick={onAddClick} 
        className="px-5 py-2.5 bg-[#d4af37] text-black hover:bg-white rounded-full font-bold text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-[#d4af37]/10"
      >
        <IconPlus className="w-4 h-4" /> Adicionar Obra
      </button>

    </header>
  );
}
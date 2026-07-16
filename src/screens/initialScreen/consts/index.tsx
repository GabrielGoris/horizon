import { BookOpen, Film, Gamepad2, Tv } from 'lucide-react';
import type { CategoryDef } from '../../../components/Sidebar/types';


export const CATEGORIES: CategoryDef[] = [
  {
    id: 'animes',
    plural: 'Animes',
    singular: 'Anime',
    icon: <Tv size={15} strokeWidth={2.2} />,
  },
  {
    id: 'movies',
    plural: 'Filmes e séries',
    singular: 'Filme e série',
    icon: <Film size={15} strokeWidth={2.2} />,
  },
  {
    id: 'games',
    plural: 'Jogos',
    singular: 'Jogo',
    icon: <Gamepad2 size={15} strokeWidth={2.2} />,
    unit: 'h',
  },
  {
    id: 'books',
    plural: 'Livros',
    singular: 'Livro',
    icon: <BookOpen size={15} strokeWidth={2.2} />,
  },
];

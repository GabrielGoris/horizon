import { BookOpen, Film, Gamepad2 } from 'lucide-react';
import type { CategoryDef } from '../../../components/Sidebar/types';


export const CATEGORIES: CategoryDef[] = [
  {
    id: 'games',
    plural: 'Jogos',
    singular: 'Jogo',
    icon: <Gamepad2 size={15} strokeWidth={2.2} />,
    unit: 'h',
  },
  {
    id: 'movies',
    plural: 'Filmes e séries',
    singular: 'Filme e série',
    icon: <Film size={15} strokeWidth={2.2} />,
  },
  {
    id: 'books',
    plural: 'Livros',
    singular: 'Livro',
    icon: <BookOpen size={15} strokeWidth={2.2} />,
  },
];
import { BookOpen, Film, Gamepad2 } from "lucide-react";
import type { CreateMediaDTO } from "../../../schemas/media/dto/create-media.dto";
import type { MediaType } from "../../../types";

export const typeOptions: Array<{
  type: MediaType;
  title: string;
  description: string;
  icon: typeof Gamepad2;
}> = [
  {
    type: "games",
    title: "Jogo",
    description: "Estudio, plataforma, gênero e capa.",
    icon: Gamepad2,
  },
  {
    type: "movies",
    title: "Filme",
    description: "Diretor, produtora, gênero e poster.",
    icon: Film,
  },
  {
    type: "books",
    title: "Livro",
    description: "Autor, editora, categoria e capa.",
    icon: BookOpen,
  },
];

export const fieldCopy = {
  games: {
    title: "Adicionar Jogo",
    nameLabel: "Titulo do Jogo *",
    namePlaceholder: "Ex: Elden Ring",
    creatorLabel: "Estudio / Desenvolvedora",
    creatorPlaceholder: "Ex: FromSoftware",
    metaLabel: "Plataforma principal",
    metaPlaceholder: "Ex: PS5, PC, Switch...",
    categoryPlaceholder: "Ex: RPG, Soulslike...",
    coverLabel: "URL da Capa",
    descriptionLabel: "Resumo / Observacoes",
    descriptionPlaceholder: "Sobre o que e este jogo?",
    statusOptions: {
      queue: "Na Fila (Quero jogar)",
      reading: "Jogando",
      new: "Jogado Recentemente",
      complete: "Finalizado / Completo",
    },
  },
  movies: {
    title: "Adicionar Filme",
    nameLabel: "Titulo do Filme *",
    namePlaceholder: "Ex: Duna: Parte Dois",
    creatorLabel: "Estudio / Produtora",
    creatorPlaceholder: "Ex: Legendary Pictures",
    directorLabel: "Diretor",
    directorPlaceholder: "Ex: Denis Villeneuve",
    metaLabel: "Origem / Idioma",
    metaPlaceholder: "Ex: Estados Unidos, Franca...",
    categoryPlaceholder: "Ex: Ficcao Cientifica, Drama...",
    coverLabel: "URL do Poster",
    descriptionLabel: "Sinopse",
    descriptionPlaceholder: "Sobre o que e este filme?",
    statusOptions: {
      queue: "Na Fila (Quero ver)",
      reading: "Assistindo",
      new: "Visto Recentemente",
      complete: "Finalizado / Visto",
    },
  },
  books: {
    title: "Adicionar Livro",
    nameLabel: "Titulo do Livro *",
    namePlaceholder: "Ex: O Nome do Vento",
    creatorLabel: "Autor",
    creatorPlaceholder: "Ex: Patrick Rothfuss",
    metaLabel: "Editora",
    metaPlaceholder: "Ex: Arqueiro",
    categoryPlaceholder: "Ex: Fantasia, Romance...",
    coverLabel: "URL da Capa",
    descriptionLabel: "Sinopse / Comentario",
    descriptionPlaceholder: "Sobre o que e este livro?",
    statusOptions: {
      queue: "Na Fila (Quero ler)",
      reading: "Lendo",
      new: "Lido Recentemente",
      complete: "Finalizado / Lido",
    },
  },
};

export function getDefaultValues(type: MediaType): CreateMediaDTO {
  return {
    title: "",
    creator: "",
    director: "",
    type,
    category: "",
    cover: "",
    backdrop: "",
    status: "queue",
    release_year: "",
    meta: "",
    description: "",
  };
}

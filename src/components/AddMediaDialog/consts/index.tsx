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
    title: "Filme / Série",
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
    descriptionLabel: "Resumo / Observações",
    descriptionPlaceholder: "Sobre o que é este jogo?",
    statusOptions: {
      queue: "Na Fila (Quero jogar)",
      in_progress: "Jogando",
      dropped: "Dropado",
      complete: "Finalizado / Completo",
    },
  },
  movies: {
    title: "Adicionar Filme ou Série",
    nameLabel: "Titulo *",
    namePlaceholder: "Ex: Duna: Parte Dois, Breaking Bad...",
    creatorLabel: "Estudio / Produtora",
    creatorPlaceholder: "Ex: Legendary Pictures",
    directorLabel: "Diretor / Criador",
    directorPlaceholder: "Ex: Denis Villeneuve, Vince Gilligan...",
    metaLabel: "Origem / Idioma",
    metaPlaceholder: "Ex: Estados Unidos, França...",
    categoryPlaceholder: "Ex: Ficcao Cientifica, Drama...",
    coverLabel: "URL do Poster",
    descriptionLabel: "Sinopse",
    descriptionPlaceholder: "Sobre o que é esta obra?",
    statusOptions: {
      queue: "Na Fila (Quero ver)",
      in_progress: "Assistindo",
      dropped: "Dropado",
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
    descriptionLabel: "Sinopse / Comentário",
    descriptionPlaceholder: "Sobre o que e este livro?",
    statusOptions: {
      queue: "Na Fila (Quero ler)",
      in_progress: "Lendo",
      dropped: "Dropado",
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
    movie_kind: "movie",
    category: "",
    cover: "",
    backdrop: "",
    status: "queue",
    release_year: "",
    added_at: new Date().toLocaleDateString("pt-BR"),
    completed_year: "",
    watched_at: "",
    isbn: "",
    page_count: "",
    runtime_minutes: "",
    season_count: "",
    episode_count: "",
    campaign_hours: "",
    rating: "",
    meta: "",
    description: "",
  };
}

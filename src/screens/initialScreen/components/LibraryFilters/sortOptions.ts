import type { SortOption } from "../types";

export function getSortOptions(activeTab: string): SortOption[] {
  const defaultOptions: SortOption[] = [
    { value: "title_asc", label: "Título: A–Z" },
    { value: "title_desc", label: "Título: Z–A" },
    { value: "rating_desc", label: "Melhor avaliados" },
    { value: "rating_asc", label: "Pior avaliados" },
  ];

  if (activeTab === "games") {
    return [
      ...defaultOptions,
      { value: "campaign_asc", label: "Campanha menor" },
      { value: "campaign_desc", label: "Campanha maior" },
    ];
  }

  if (activeTab === "movies" || activeTab === "animes") {
    return [
      ...defaultOptions,
      { value: "runtime_asc", label: "Menor duração" },
      { value: "runtime_desc", label: "Maior duração" },
    ];
  }

  if (activeTab === "books") {
    return [
      ...defaultOptions,
      { value: "pages_asc", label: "Menos páginas" },
      { value: "pages_desc", label: "Mais páginas" },
    ];
  }

  return defaultOptions;
}


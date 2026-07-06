import type { MediaItem } from "../../../types";
import { formatTicketDate } from "../utils";

type Fact = {
  label: string;
  value?: string | number;
};

function getDossierFacts(item: MediaItem, mediaDisplayType: string): Fact[] {
  const isSeries = mediaDisplayType === "Série";

  if (item.type === "movies" && isSeries) {
    return [
      { label: "Tipo", value: "Série" },
      { label: "Temporadas", value: item.season_count || "Não informado" },
      { label: "Episódios", value: item.episode_count || "Não informado" },
      { label: "Criador", value: item.director || item.creator },
      { label: "Ano", value: item.releaseYear },
      { label: "Assistida em", value: item.watched_at ? formatTicketDate(item.watched_at) : "" },
    ];
  }

  if (item.type === "movies") {
    return [
      { label: "Tipo", value: "Filme" },
      { label: "Duração", value: item.runtime_minutes ? `${item.runtime_minutes} min` : "" },
      { label: "Diretor", value: item.director },
      { label: "Ano", value: item.releaseYear },
      { label: "Assistido em", value: item.watched_at ? formatTicketDate(item.watched_at) : "" },
    ];
  }

  if (item.type === "books") {
    return [
      { label: "Tipo", value: "Livro" },
      { label: "Páginas", value: item.page_count },
      { label: "Autor", value: item.creator },
      { label: "Ano", value: item.releaseYear },
      { label: "Lido em", value: item.completed_at ? formatTicketDate(item.completed_at) : "" },
    ];
  }

  return [
    { label: "Tipo", value: "Jogo" },
    { label: "Campanha", value: item.campaign_hours ? `${item.campaign_hours} h` : "" },
    { label: "Estúdio", value: item.creator },
    { label: "Ano", value: item.releaseYear },
    { label: "Finalizado em", value: item.completed_at ? formatTicketDate(item.completed_at) : "" },
  ];
}

export function DossierFacts({ item, mediaDisplayType }: { item: MediaItem; mediaDisplayType: string }) {
  const facts = getDossierFacts(item, mediaDisplayType);
  const visibleFacts = facts.filter((fact) => fact.value !== undefined && fact.value !== null && String(fact.value).trim() !== "");

  if (visibleFacts.length === 0) return null;

  return (
    <section className="mt-8 rounded-xl border border-white/10 bg-white/[0.025] p-5">
      <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-neutral-600">
        Ficha
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-4">
        {visibleFacts.map((fact) => (
          <div key={fact.label} className="min-w-0">
            <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-600">
              {fact.label}
            </span>
            <span className="mt-1 block truncate text-sm font-semibold text-neutral-200">
              {fact.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

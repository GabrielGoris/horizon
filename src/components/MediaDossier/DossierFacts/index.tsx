import { ArrowLeftRight } from "lucide-react";
import { useState } from "react";
import type { MediaItem } from "../../../types";
import { formatTicketDate } from "../utils";

type Fact = {
  label: string;
  value?: string | number;
};

function formatGameCampaignTime(value?: string | number) {
  if (value === undefined || value === null || value === "") return "";

  if (typeof value === "string" && /h|min/i.test(value)) return value;

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) return String(value);

  const totalMinutes = Math.round(numericValue * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!hours) return `${minutes} min`;
  if (!minutes) return `${hours}h`;

  return `${hours}h ${minutes} min`;
}

function hasTime(value?: string | number) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function getGameTimeFact(item: MediaItem, timeView: "campaign" | "played"): Fact {
  if (timeView === "played" && hasTime(item.hours_played)) {
    return { label: "Tempo jogado", value: formatGameCampaignTime(item.hours_played) };
  }

  return { label: "História principal", value: formatGameCampaignTime(item.campaign_hours) };
}

function getDossierFacts(item: MediaItem, mediaDisplayType: string, gameTimeView: "campaign" | "played"): Fact[] {
  const isSeries = item.media_format === "series";
  const isAudiovisual = item.type === "movies" || item.type === "animes";

  if (isAudiovisual && isSeries) {
    return [
      { label: "Tipo", value: item.type === "animes" ? "Anime (Série)" : mediaDisplayType },
      { label: "Temporadas", value: item.season_count || "Não informado" },
      { label: "Episódios", value: item.episode_count || "Não informado" },
      { label: "Criador", value: item.director || item.creator },
      { label: "Ano", value: item.releaseYear },
      { label: "Assistida em", value: item.watched_at ? formatTicketDate(item.watched_at) : "" },
    ];
  }

  if (isAudiovisual) {
    return [
      { label: "Tipo", value: item.type === "animes" ? "Anime (Filme)" : mediaDisplayType },
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
    getGameTimeFact(item, gameTimeView),
    { label: "Estúdio", value: item.creator },
    { label: "Ano", value: item.releaseYear },
  ];
}

export function DossierFacts({ item, mediaDisplayType }: { item: MediaItem; mediaDisplayType: string }) {
  const [gameTimeView, setGameTimeView] = useState<"campaign" | "played">("played");
  const hasCampaignTime = hasTime(item.campaign_hours);
  const hasPlayedTime = hasTime(item.hours_played);
  const canSwitchGameTime = item.type === "games" && hasCampaignTime && hasPlayedTime;
  const activeGameTimeView = gameTimeView === "campaign" && hasCampaignTime
    ? "campaign"
    : hasPlayedTime
      ? "played"
      : "campaign";
  const facts = getDossierFacts(item, mediaDisplayType, activeGameTimeView);
  const visibleFacts = facts.filter((fact) => fact.value !== undefined && fact.value !== null && String(fact.value).trim() !== "");

  if (visibleFacts.length === 0) return null;

  return (
    <section className="mt-8 rounded-xl border border-white/10 bg-white/[0.025] p-5">
      <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-neutral-600">
        Ficha
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-4">
        {visibleFacts.map((fact) => {
          const isGameTimeFact = fact.label === "Tempo jogado" || fact.label === "História principal";

          if (canSwitchGameTime && isGameTimeFact) {
            return (
              <div key="game-time" className="min-w-0">
                <div className="flex h-4 items-center gap-1.5">
                  <span className="font-mono text-[9px] font-bold uppercase leading-none tracking-[0.18em] text-neutral-600">
                    {activeGameTimeView === "campaign" ? "Tempo de campanha" : "Tempo jogado"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setGameTimeView(activeGameTimeView === "campaign" ? "played" : "campaign")}
                    aria-label={activeGameTimeView === "campaign" ? "Ver tempo jogado" : "Ver tempo de campanha"}
                    title={activeGameTimeView === "campaign" ? "Ver tempo jogado" : "Ver tempo de campanha"}
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full leading-none text-neutral-600 transition-colors hover:bg-white/5 hover:text-noir-champagne"
                  >
                    <ArrowLeftRight size={9} className="block" />
                  </button>
                </div>
                <span className="mt-1 block truncate text-sm font-semibold text-neutral-200">
                  {fact.value}
                </span>
              </div>
            );
          }

          return (
            <div key={fact.label} className="min-w-0">
              <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-600">
                {fact.label}
              </span>
              <span className="mt-1 block truncate text-sm font-semibold text-neutral-200">
                {fact.value}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

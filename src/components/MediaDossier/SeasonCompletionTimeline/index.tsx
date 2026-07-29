import { useEffect, useMemo, useState } from "react";
import { HorizonSelect } from "../../HorizonSelect";
import { RatingStars } from "../../RatingStars";
import type { MediaItem } from "../../../types";
import { fetchAudiovisualSeasonCompletions, saveAudiovisualSeasonCompletion, type AudiovisualSeasonCompletion } from "../../../services/audiovisualSeasonService";
import { formatDateInput, getDateInputValue } from "../utils";

export function SeasonCompletionTimeline({ item }: { item: MediaItem }) {
  const totalSeasons = Math.max(1, Number(item.season_count) || 0);
  const [entries, setEntries] = useState<AudiovisualSeasonCompletion[]>([]);
  const [selectedSeason, setSelectedSeason] = useState("1");
  const [watchedDates, setWatchedDates] = useState<Record<number, string>>({});
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [error, setError] = useState("");
  const seasonNumber = Number(selectedSeason);

  useEffect(() => {
    void fetchAudiovisualSeasonCompletions(item.id)
      .then((loaded) => {
        setEntries(loaded);
        setWatchedDates(Object.fromEntries(loaded.map((entry) => [entry.seasonNumber, getDateInputValue(entry.watchedAt)])));
        setRatings(Object.fromEntries(loaded.map((entry) => [entry.seasonNumber, entry.rating ?? 0])));
      })
      .catch(() => setError("Não foi possível carregar as temporadas."));
  }, [item.id]);

  const selectedEntry = entries.find((entry) => entry.seasonNumber === seasonNumber);
  const watchedAt = watchedDates[seasonNumber] ?? (selectedEntry ? getDateInputValue(selectedEntry.watchedAt) : "");
  const rating = ratings[seasonNumber] ?? selectedEntry?.rating ?? 0;
  const period = useMemo(() => {
    const years = entries.map((entry) => entry.watchedAt.slice(0, 4)).filter(Boolean).sort();
    return years.length ? (years[0] === years.at(-1) ? years[0] : `${years[0]} — ${years.at(-1)}`) : "";
  }, [entries]);

  const save = async (nextRating = rating) => {
    try {
      await saveAudiovisualSeasonCompletion(item.id, seasonNumber, watchedAt, nextRating || null);
      const storedDate = watchedAt.length === 4 ? `${watchedAt}-01-01` : watchedAt.split("/").reverse().join("-");
      setEntries((current) => [...current.filter((entry) => entry.seasonNumber !== seasonNumber), { rating: nextRating || null, seasonNumber, watchedAt: storedDate }].sort((first, second) => first.seasonNumber - second.seasonNumber));
      setRatings((current) => ({ ...current, [seasonNumber]: nextRating }));
      setError("");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar a temporada.");
    }
  };

  return (
    <section className="mt-8 rounded-xl border border-white/10 bg-white/[0.025] p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-neutral-600">Temporadas assistidas</p>
        {period && <span className="font-mono text-[10px] font-bold tracking-[0.14em] text-noir-champagne">{period}</span>}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="min-w-0">
          <span className="mb-1.5 block font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-600">Temporada</span>
          <HorizonSelect
            ariaLabel="Selecionar temporada"
            value={selectedSeason}
            onChange={setSelectedSeason}
            options={Array.from({ length: totalSeasons }, (_, index) => ({ label: `Temporada ${index + 1}`, value: String(index + 1) }))}
            className="[&_button]:h-10 [&_button]:py-0 [&_button]:font-mono [&_button]:text-xs"
          />
        </label>
        <label>
          <span className="mb-1.5 block font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-600">Data assistida</span>
          <input
            value={watchedAt}
            placeholder="DD/MM/AAAA"
            inputMode="numeric"
            onChange={(event) => setWatchedDates((current) => ({ ...current, [seasonNumber]: formatDateInput(event.target.value) }))}
            onBlur={() => { if (watchedAt.trim()) void save(); }}
            onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
            className="h-10 w-full rounded-lg border border-white/10 bg-[#131315] px-3 font-mono text-xs text-white outline-none transition focus:border-noir-gold focus:ring-1 focus:ring-noir-gold"
          />
        </label>
      </div>
      <div className="mt-4 flex items-center justify-between gap-4 border-t border-white/[0.07] pt-4">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-600">Nota da temporada</span>
        <RatingStars value={rating} onChange={(nextRating) => setRatings((current) => ({ ...current, [seasonNumber]: nextRating }))} onCommit={(nextRating) => { if (watchedAt.trim()) return save(nextRating); }} size={17} emptyClassName="text-white/20" filledClassName="fill-noir-gold text-noir-gold" />
      </div>
      {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
    </section>
  );
}

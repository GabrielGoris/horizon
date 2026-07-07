import { useState } from "react";
import { getInitialWatchedDate, getNumericRating } from "../utils";
import { BookBookmark } from "./BookBookmark";
import { GameSaveCard } from "./GameSaveCard";
import { MovieTicket } from "./MovieTicket";
import type { CompletionArtifactProps } from "./types";

export function CompletionArtifacts({
  item,
  onSaveTicket,
  onSaveBookCompletion,
  onSaveGameCompletion,
}: CompletionArtifactProps) {
  const [finishedAt, setFinishedAt] = useState(() => getInitialWatchedDate(item));
  const [rating, setRating] = useState(() => getNumericRating(item.rating));
  const [hoursPlayed, setHoursPlayed] = useState(() => String(item.hours_played ?? ""));
  const [completionType, setCompletionType] = useState(() => item.completion_type || "Campanha");

  if (item.status !== "complete") return null;

  const saveTicket = async (values?: { watchedAt?: string; rating?: number }) => {
    const nextWatchedAt = values?.watchedAt ?? finishedAt;
    const nextRating = values?.rating ?? rating;

    await onSaveTicket(item, {
      watchedAt: nextWatchedAt,
      rating: nextRating > 0 ? nextRating.toFixed(1) : "",
    });
  };

  const saveBook = async (values?: { finishedAt?: string; rating?: number }) => {
    const nextFinishedAt = values?.finishedAt ?? finishedAt;
    const nextRating = values?.rating ?? rating;

    await onSaveBookCompletion(item, {
      finishedAt: nextFinishedAt,
      rating: nextRating > 0 ? nextRating.toFixed(1) : "",
      pages: String(item.page_count ?? ""),
    });
  };

  const saveGame = async (values?: {
    finishedAt?: string;
    rating?: number;
    hoursPlayed?: string;
    completionType?: string;
  }) => {
    const nextFinishedAt = values?.finishedAt ?? finishedAt;
    const nextRating = values?.rating ?? rating;
    const nextHoursPlayed = values?.hoursPlayed ?? hoursPlayed;
    const nextCompletionType = values?.completionType ?? completionType;

    await onSaveGameCompletion(item, {
      finishedAt: nextFinishedAt,
      rating: nextRating > 0 ? nextRating.toFixed(1) : "",
      hoursPlayed: nextHoursPlayed,
      completionType: nextCompletionType,
    });
  };

  if (item.type === "movies") {
    return (
      <>
        <MovieTicket
          item={item}
          watchedAt={finishedAt}
          rating={rating}
          onWatchedAtChange={setFinishedAt}
          onRatingChange={setRating}
          onSave={saveTicket}
        />
      </>
    );
  }

  if (item.type === "books") {
    return (
      <>
        <BookBookmark
          item={item}
          finishedAt={finishedAt}
          rating={rating}
          onFinishedAtChange={setFinishedAt}
          onRatingChange={setRating}
          onSave={saveBook}
        />
      </>
    );
  }

  if (item.type === "games") {
    return (
      <>
        <GameSaveCard
          item={item}
          finishedAt={finishedAt}
          rating={rating}
          hoursPlayed={hoursPlayed}
          completionType={completionType}
          onFinishedAtChange={setFinishedAt}
          onRatingChange={setRating}
          onHoursPlayedChange={setHoursPlayed}
          onCompletionTypeChange={setCompletionType}
          onSave={saveGame}
        />
      </>
    );
  }

  return null;
}

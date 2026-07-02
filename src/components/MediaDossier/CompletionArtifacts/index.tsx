import { useMemo, useState } from "react";
import { getInitialWatchedDate, getNumericRating } from "../utils";
import { BookBookmark } from "./BookBookmark";
import { BookBookmarkEditor } from "./BookBookmarkEditor";
import { GameSaveCard } from "./GameSaveCard";
import { GameSaveEditor } from "./GameSaveEditor";
import { MovieTicket } from "./MovieTicket";
import { MovieTicketEditor } from "./MovieTicketEditor";
import type { CompletionArtifactProps } from "./types";

export function CompletionArtifacts({
  item,
  onSaveTicket,
  onSaveBookCompletion,
  onSaveGameCompletion,
}: CompletionArtifactProps) {
  const [isTicketEditorOpen, setIsTicketEditorOpen] = useState(false);
  const [finishedAt, setFinishedAt] = useState(() => getInitialWatchedDate(item));
  const [rating, setRating] = useState(() => getNumericRating(item.rating));
  const [pages, setPages] = useState(() => String(item.pages ?? ""));
  const [hoursPlayed, setHoursPlayed] = useState(() => String(item.hours_played ?? ""));
  const [completionType, setCompletionType] = useState(() => item.completion_type ?? "");
  const stars = useMemo(() => Array.from({ length: 5 }, (_, index) => index + 1), []);

  if (item.status !== "complete") return null;

  const saveTicket = async () => {
    await onSaveTicket(item, {
      watchedAt: finishedAt,
      rating: rating > 0 ? rating.toFixed(1) : "",
    });

    setIsTicketEditorOpen(false);
  };

  const saveBook = async () => {
    await onSaveBookCompletion(item, {
      finishedAt,
      rating: rating > 0 ? rating.toFixed(1) : "",
      pages,
    });

    setIsTicketEditorOpen(false);
  };

  const saveGame = async () => {
    await onSaveGameCompletion(item, {
      finishedAt,
      rating: rating > 0 ? rating.toFixed(1) : "",
      hoursPlayed,
      completionType,
    });

    setIsTicketEditorOpen(false);
  };

  if (item.type === "movies") {
    return (
      <>
        <MovieTicket
          item={item}
          watchedAt={finishedAt}
          rating={rating}
          onClick={() => setIsTicketEditorOpen(true)}
        />

        {isTicketEditorOpen && (
          <MovieTicketEditor
            item={item}
            watchedAt={finishedAt}
            rating={rating}
            stars={stars}
            onWatchedAtChange={setFinishedAt}
            onRatingChange={setRating}
            onClose={() => setIsTicketEditorOpen(false)}
            onSave={saveTicket}
          />
        )}
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
          pages={pages}
          onClick={() => setIsTicketEditorOpen(true)}
        />

        {isTicketEditorOpen && (
          <BookBookmarkEditor
            item={item}
            finishedAt={finishedAt}
            rating={rating}
            pages={pages}
            stars={stars}
            onFinishedAtChange={setFinishedAt}
            onRatingChange={setRating}
            onPagesChange={setPages}
            onClose={() => setIsTicketEditorOpen(false)}
            onSave={saveBook}
          />
        )}
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
          onClick={() => setIsTicketEditorOpen(true)}
        />

        {isTicketEditorOpen && (
          <GameSaveEditor
            item={item}
            finishedAt={finishedAt}
            rating={rating}
            hoursPlayed={hoursPlayed}
            completionType={completionType}
            stars={stars}
            onFinishedAtChange={setFinishedAt}
            onRatingChange={setRating}
            onHoursPlayedChange={setHoursPlayed}
            onCompletionTypeChange={setCompletionType}
            onClose={() => setIsTicketEditorOpen(false)}
            onSave={saveGame}
          />
        )}
      </>
    );
  }

  return null;
}

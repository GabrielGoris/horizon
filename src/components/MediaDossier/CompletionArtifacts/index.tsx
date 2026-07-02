import { useMemo, useState } from "react";
import { getInitialWatchedDate, getNumericRating } from "../utils";
import { MovieTicket } from "./MovieTicket";
import { MovieTicketEditor } from "./MovieTicketEditor";
import type { CompletionArtifactProps } from "./types";

export function CompletionArtifacts({ item, onSaveTicket }: CompletionArtifactProps) {
  const [isTicketEditorOpen, setIsTicketEditorOpen] = useState(false);
  const [watchedAt, setWatchedAt] = useState(() => getInitialWatchedDate(item));
  const [ticketRating, setTicketRating] = useState(() => getNumericRating(item.rating));
  const stars = useMemo(() => Array.from({ length: 5 }, (_, index) => index + 1), []);

  if (item.status !== "complete") return null;

  const saveTicket = async () => {
    await onSaveTicket(item, {
      watchedAt,
      rating: ticketRating > 0 ? ticketRating.toFixed(1) : "",
    });

    setIsTicketEditorOpen(false);
  };

  if (item.type === "movies") {
    return (
      <>
        <MovieTicket
          item={item}
          watchedAt={watchedAt}
          rating={ticketRating}
          onClick={() => setIsTicketEditorOpen(true)}
        />

        {isTicketEditorOpen && (
          <MovieTicketEditor
            item={item}
            watchedAt={watchedAt}
            rating={ticketRating}
            stars={stars}
            onWatchedAtChange={setWatchedAt}
            onRatingChange={setTicketRating}
            onClose={() => setIsTicketEditorOpen(false)}
            onSave={saveTicket}
          />
        )}
      </>
    );
  }

  return null;
}

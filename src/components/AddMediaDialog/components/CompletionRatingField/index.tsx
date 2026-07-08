import { RatingStars } from "../../../RatingStars";
import type { CompletionRatingFieldProps } from "../types";

export function CompletionRatingField({ ratingValue, setValue }: CompletionRatingFieldProps) {
  const rating = Number.parseFloat(ratingValue || "0") || 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Nota
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
          {rating > 0 ? rating.toFixed(1) : "0 estrelas"}
        </span>
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#131315] px-4 py-3">
        <RatingStars
          value={rating}
          onChange={(nextRating) => {
            setValue("rating", nextRating > 0 ? nextRating.toFixed(1) : "", {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
          size={19}
          emptyClassName="text-white/20"
          filledClassName="fill-noir-gold text-noir-gold"
        />
      </div>
    </div>
  );
}

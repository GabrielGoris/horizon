import type { MouseEvent } from "react";
import { useState } from "react";
import { Star } from "lucide-react";

type RatingStarsProps = {
  value: number;
  onChange: (rating: number) => void;
  onCommit?: (rating: number) => void | Promise<void>;
  size?: number;
  emptyClassName: string;
  filledClassName: string;
  className?: string;
};

function getRatingFromMouse(event: MouseEvent<HTMLButtonElement>, star: number) {
  const { left, width } = event.currentTarget.getBoundingClientRect();
  const clickRatio = (event.clientX - left) / width;

  if (star === 1 && clickRatio <= 0.33) return 0;
  if (star === 1 && clickRatio <= 0.66) return 0.5;

  return clickRatio <= 0.5 ? star - 0.5 : star;
}

export function RatingStars({
  value,
  onChange,
  onCommit,
  size = 14,
  emptyClassName,
  filledClassName,
  className = "flex items-center gap-1",
}: RatingStarsProps) {
  const [previewRating, setPreviewRating] = useState<number | null>(null);
  const visibleRating = previewRating ?? value;

  return (
    <div className={className} onMouseLeave={() => setPreviewRating(null)}>
      {Array.from({ length: 5 }, (_, index) => {
        const star = index + 1;
        const fillPercentage = Math.max(0, Math.min(1, visibleRating - index)) * 100;

        return (
          <button
            key={star}
            type="button"
            className="relative inline-flex transition-transform hover:scale-110"
            onClick={(event) => {
              const nextRating = getRatingFromMouse(event, star);

              onChange(nextRating);
              void onCommit?.(nextRating);
            }}
            onMouseMove={(event) => setPreviewRating(getRatingFromMouse(event, star))}
            aria-label={`Dar nota ate ${star}`}
          >
            <span className="relative inline-flex">
              <Star size={size} className={emptyClassName} />
              {fillPercentage > 0 && (
                <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercentage}%` }}>
                  <Star size={size} className={filledClassName} />
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

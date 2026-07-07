import type { MouseEvent } from "react";

export function getRatingFromMouse(event: MouseEvent<HTMLButtonElement>, star: number) {
  const { left, width } = event.currentTarget.getBoundingClientRect();
  const clickRatio = (event.clientX - left) / width;

  if (star === 1 && clickRatio <= 0.33) return 0;
  if (star === 1 && clickRatio <= 0.66) return 0.5;

  return clickRatio <= 0.5 ? star - 0.5 : star;
}

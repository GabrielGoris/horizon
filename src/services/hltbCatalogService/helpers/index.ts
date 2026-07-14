import type { GameCatalogResult, HltbSearchItem } from "../../types";
import { minHltbSimilarity } from "../consts";

function normalizeHltbTitle(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getHltbMatchScore(item: HltbSearchItem, game: GameCatalogResult) {
  const expectedTitle = normalizeHltbTitle(game.title);
  const names = [item.name, item.alias]
    .filter((name): name is string => Boolean(name))
    .map(normalizeHltbTitle);
  const hasExactTitle = names.some((name) => name === expectedTitle);
  const expectedYear = Number(game.releaseYear);
  const hasComparableYears = Number.isFinite(expectedYear) && Boolean(item.releaseYear);
  const yearDifference = hasComparableYears ? Math.abs(expectedYear - (item.releaseYear ?? 0)) : 0;
  const hasCompatibleYear = !hasComparableYears || yearDifference <= 1;

  if (!item.mainTime || item.type !== "game") return -1;
  if (!hasExactTitle && (item.similarity < minHltbSimilarity || !hasCompatibleYear)) return -1;

  return (
    (hasExactTitle ? 1_000 : 0)
    + item.similarity * 500
    + (hasCompatibleYear ? 150 : 0)
  );
}

export function getHltbCacheKey(game: GameCatalogResult) {
  return `${normalizeHltbTitle(game.title)}:${game.releaseYear}`;
}

export function findMatchingHltbGame(items: HltbSearchItem[], game: GameCatalogResult) {
  return items
    .map((item) => ({ item, score: getHltbMatchScore(item, game) }))
    .filter(({ score }) => score >= 0)
    .sort((first, second) => second.score - first.score)[0]?.item;
}

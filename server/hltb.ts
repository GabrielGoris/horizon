import { HowLongToBeatService, SearchModifier } from "howlongtobeat-ts";

type GameForHltb = {
  appId: number;
  releaseYear?: string | null;
  title: string;
};

const hltbService = new HowLongToBeatService({
  minSimilarity: 0.45,
  retries: 0,
  timeout: 6_500,
});

function normalizeTitle(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getSearchQueries(title: string) {
  const withoutStudioPrefix = title.replace(/^\s*\[[^\]]+\]\s*/u, "");
  const withoutAlternateTitle = withoutStudioPrefix.split("|")[0]?.trim() ?? withoutStudioPrefix;
  const withoutEdition = withoutAlternateTitle
    .replace(
      /\b(?:game\s+of\s+the\s+year|goty|complete|definitive|deluxe|ultimate)\s*(?:edition)?\b/giu,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
  const latinOnly = withoutEdition
    .replace(/[^\p{Script=Latin}\p{Number}\s:'’&+.!?-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  return [...new Set([title.trim(), withoutStudioPrefix, withoutAlternateTitle, withoutEdition, latinOnly])]
    .filter(Boolean);
}

function secondsToDuration(value?: number) {
  if (!value) return "";

  const totalMinutes = Math.round(value / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!hours) return `${minutes} min`;
  if (!minutes) return `${hours}h`;

  return `${hours}h ${minutes} min`;
}

async function findCampaignHours(game: GameForHltb) {
  const expectedTitle = normalizeTitle(game.title);
  const expectedYear = Number(game.releaseYear);

  for (const query of getSearchQueries(game.title)) {
    const response = await hltbService.search(query, { modifier: SearchModifier.HIDE_DLC });

    if (!response.success) continue;

    const match = response.data
      .map((item) => {
        const names = [item.name, item.alias]
          .filter((name): name is string => Boolean(name))
          .map(normalizeTitle);
        const exact = names.some((name) => name === expectedTitle);
        const hasComparableYears = Number.isFinite(expectedYear) && Boolean(item.releaseYear);
        const yearDifference = hasComparableYears ? Math.abs(expectedYear - (item.releaseYear ?? 0)) : 0;
        const compatibleYear = !hasComparableYears || yearDifference <= 1;
        const exactYear = hasComparableYears && yearDifference === 0;
        const valid = item.type === "game"
          && Boolean(item.mainTime)
          && (exact || (item.similarity >= 0.82 && compatibleYear));

        return {
          item,
          score: valid
            ? (exact ? 1_000 : 0) + item.similarity * 500 + (exactYear ? 250 : compatibleYear ? 100 : 0)
            : -1,
        };
      })
      .filter(({ score }) => score >= 0)
      .sort((first, second) => second.score - first.score)[0]?.item;

    if (match?.mainTime) return secondsToDuration(match.mainTime);
  }

  return "";
}

export async function getHltbCampaignHoursByGames(games: GameForHltb[]) {
  const result = new Map<number, string>();

  for (let index = 0; index < games.length; index += 2) {
    const batch = games.slice(index, index + 2);
    const durations = await Promise.all(batch.map(async (game) => ({
      appId: game.appId,
      duration: await findCampaignHours(game).catch(() => ""),
    })));

    durations.forEach(({ appId, duration }) => {
      if (duration) result.set(appId, duration);
    });
  }

  return result;
}

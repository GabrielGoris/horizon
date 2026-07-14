import { CatalogCache } from "../catalogCache";
import { requestCatalog } from "../catalogProxy";
import type { GameCatalogResult, HltbSearchResponse } from "../types";
import { hltbRequestTimeoutMs } from "./consts";
import { findMatchingHltbGame, getHltbCacheKey } from "./helpers";

const campaignCache = new CatalogCache<string>();
const campaignRequests = new Map<string, Promise<string>>();

function secondsToDuration(value?: number) {
  if (!value) return "";

  const totalMinutes = Math.round(value / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!hours) return `${minutes} min`;
  if (!minutes) return `${hours}h`;

  return `${hours}h ${minutes} min`;
}

export async function getHltbCampaignHours(game: GameCatalogResult, signal?: AbortSignal) {
  const cacheKey = getHltbCacheKey(game);
  const cachedValue = campaignCache.get(cacheKey);

  if (cachedValue !== null) return cachedValue;

  const activeRequest = campaignRequests.get(cacheKey);

  if (activeRequest) return activeRequest;

  const request = requestCatalog<HltbSearchResponse>(
    "hltb",
    "search",
    {
      searchParams: new URLSearchParams({ title: game.title }),
      signal,
      timeoutMs: hltbRequestTimeoutMs,
    },
  ).then((response) => {
    const campaignHours = secondsToDuration(findMatchingHltbGame(response.items ?? [], game)?.mainTime);

    campaignCache.set(cacheKey, campaignHours);

    return campaignHours;
  });

  campaignRequests.set(cacheKey, request);

  try {
    return await request;
  } finally {
    if (campaignRequests.get(cacheKey) === request) {
      campaignRequests.delete(cacheKey);
    }
  }
}

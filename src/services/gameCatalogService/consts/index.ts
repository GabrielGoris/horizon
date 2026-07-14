export const maxCatalogResults = 50;
export const maxIgdbSearchResults = 10;
export const maxIgdbPrefetchResults = 5;
export const gameCatalogWarmupTtlMs = 2 * 60_000;
export const campaignParentGameTypes: ReadonlySet<number> = new Set([8, 9, 10, 11]);
export const excludedIgdbSearchGameTypes = [1, 2, 3, 4, 5, 6, 7, 12, 13, 14] as const;

export type SteamConnection = {
  avatar_url: string | null;
  connected_at: string;
  display_name: string | null;
  last_synced_at: string | null;
  profile_url: string | null;
  steam_id: string;
};

export type SteamSyncResult = {
  added: number;
  enrichmentAppIds: number[];
  incompleteGames: SteamEnrichmentFailure[];
  linked: number;
  newGames: SteamDiscoveredGame[];
  syncedAt: string;
  total: number;
  updated: number;
};

export type SteamDiscoveredGame = {
  appId: number;
  cover: string;
  playtimeHours: number;
  title: string;
};

export type SteamEnrichmentResult = {
  enriched: number;
  failed: number;
  failedGames: SteamEnrichmentFailure[];
};

export type SteamEnrichmentFailure = {
  appId: number;
  mediaId: string;
  reason: string;
  title: string;
};

export type SteamIntegrationState = {
  connection: SteamConnection | null;
  incompleteGames: SteamEnrichmentFailure[];
};

export type ApiResponse<T> = {
  message?: string;
  ok: boolean;
} & T;

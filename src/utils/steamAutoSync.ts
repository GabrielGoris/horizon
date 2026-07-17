export const STEAM_AUTO_SYNC_INTERVAL_MS = 6 * 60 * 60 * 1_000;

export function isSteamAutoSyncDue(lastSyncedAt: string | null, now = Date.now()) {
  if (!lastSyncedAt) return true;

  const lastSyncTime = new Date(lastSyncedAt).getTime();

  return !Number.isFinite(lastSyncTime)
    || now - lastSyncTime >= STEAM_AUTO_SYNC_INTERVAL_MS;
}

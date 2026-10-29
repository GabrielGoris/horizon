// Lógica pura de reprodução da fila offline.
// Não importa nada além de tipos para poder rodar direto no `node --test`.

export const MAX_SYNC_ATTEMPTS = 6;
export const BASE_RETRY_DELAY_MS = 30_000;
export const MAX_RETRY_DELAY_MS = 60 * 60 * 1000;

export type QueueErrorKind = "network" | "auth" | "transient" | "permanent";

type ErrorLike = { code?: unknown; status?: unknown; message?: unknown; name?: unknown };

const NETWORK_MESSAGE = /failed to fetch|networkerror|network request failed|load failed|fetch failed|err_internet_disconnected/i;
const AUTH_MESSAGE = /jwt expired|invalid jwt|usuário não autenticado|refresh token/i;
const AUTH_CODES = new Set(["PGRST301", "PGRST303"]);
const SCHEMA_CODES = new Set(["PGRST204", "42703", "42P01"]);

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String((error as ErrorLike).message);

  return String(error);
}

export function classifyQueueError(error: unknown): QueueErrorKind {
  if (!error || typeof error !== "object") return "transient";

  const { code, status, message } = error as ErrorLike;
  const text = typeof message === "string" ? message : "";
  const numericStatus = Number(status);
  const errorCode = typeof code === "string" ? code : "";

  if (error instanceof TypeError || NETWORK_MESSAGE.test(text)) return "network";
  if (numericStatus === 401 || AUTH_CODES.has(errorCode) || AUTH_MESSAGE.test(text)) return "auth";
  if (/^(22|23)/.test(errorCode) || errorCode === "42501" || SCHEMA_CODES.has(errorCode)) return "permanent";
  if (numericStatus === 400 || numericStatus === 403 || numericStatus === 404 || numericStatus === 409) return "permanent";

  return "transient";
}

export function getRetryDelayMs(attempts: number) {
  return Math.min(BASE_RETRY_DELAY_MS * 2 ** Math.max(attempts - 1, 0), MAX_RETRY_DELAY_MS);
}

export type QueueEntry = {
  id?: number;
  mediaId: string;
  attempts?: number;
  nextAttemptAt?: number;
  failedAt?: string;
};

export type ExecuteOutcome = "applied" | "already-applied" | "conflict" | "gone";

export type QueueRunHooks<T extends QueueEntry> = {
  execute: (entry: T) => Promise<ExecuteOutcome>;
  onSettled: (entry: T, outcome: ExecuteOutcome) => Promise<void>;
  onRetry: (entry: T, patch: { attempts: number; nextAttemptAt: number; lastError: string }) => Promise<void>;
  onFailed: (entry: T, patch: { attempts: number; lastError: string; failedAt: string }) => Promise<void>;
  now?: () => number;
};

export type QueueRunSummary = {
  applied: number;
  conflicts: number;
  gone: number;
  retrying: number;
  failed: number;
  deferred: number;
  stoppedBy: "network" | "auth" | null;
};

export async function runOfflineQueue<T extends QueueEntry>(entries: T[], hooks: QueueRunHooks<T>): Promise<QueueRunSummary> {
  const now = hooks.now ?? Date.now;
  const blockedMedia = new Set<string>();
  const summary: QueueRunSummary = { applied: 0, conflicts: 0, gone: 0, retrying: 0, failed: 0, deferred: 0, stoppedBy: null };

  for (const entry of entries) {
    if (entry.failedAt) continue;

    if (blockedMedia.has(entry.mediaId) || (entry.nextAttemptAt !== undefined && entry.nextAttemptAt > now())) {
      blockedMedia.add(entry.mediaId);
      summary.deferred += 1;
      continue;
    }

    let outcome: ExecuteOutcome;

    try {
      outcome = await hooks.execute(entry);
    } catch (error) {
      const kind = classifyQueueError(error);

      if (kind === "network" || kind === "auth") {
        summary.stoppedBy = kind;
        break;
      }

      const attempts = (entry.attempts ?? 0) + 1;
      const lastError = getErrorMessage(error).slice(0, 300);

      if (kind === "permanent" || attempts >= MAX_SYNC_ATTEMPTS) {
        await hooks.onFailed(entry, { attempts, lastError, failedAt: new Date(now()).toISOString() });
        summary.failed += 1;
      } else {
        await hooks.onRetry(entry, { attempts, lastError, nextAttemptAt: now() + getRetryDelayMs(attempts) });
        summary.retrying += 1;
        blockedMedia.add(entry.mediaId);
      }

      continue;
    }

    await hooks.onSettled(entry, outcome);

    if (outcome === "conflict") summary.conflicts += 1;
    else if (outcome === "gone") summary.gone += 1;
    else summary.applied += 1;
  }

  return summary;
}

export function normalizeFieldValue(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();

  return String(value);
}

export type FieldMerge<K extends string> = {
  apply: K[];
  conflicts: K[];
};

export function mergeFields<K extends string>(
  base: Record<K, unknown>,
  server: Record<K, unknown>,
  intended: Record<K, unknown>,
): FieldMerge<K> {
  const result: FieldMerge<K> = { apply: [], conflicts: [] };

  for (const field of Object.keys(intended) as K[]) {
    const serverValue = normalizeFieldValue(server[field]);

    if (serverValue === normalizeFieldValue(intended[field])) continue;

    if (serverValue === normalizeFieldValue(base[field])) result.apply.push(field);
    else result.conflicts.push(field);
  }

  return result;
}

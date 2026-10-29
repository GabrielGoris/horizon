import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_SYNC_ATTEMPTS,
  classifyQueueError,
  getRetryDelayMs,
  mergeFields,
  runOfflineQueue,
  type ExecuteOutcome,
  type QueueEntry,
} from "../../src/services/offlineStore/syncQueue.ts";

type Entry = QueueEntry & { kind: string };

function createHarness(execute: (entry: Entry) => Promise<ExecuteOutcome>, now = () => 1_000_000) {
  const settled: Array<[number | undefined, ExecuteOutcome]> = [];
  const retried: Array<{ id?: number; attempts: number; nextAttemptAt: number }> = [];
  const failed: Array<{ id?: number; attempts: number; lastError: string }> = [];

  return {
    settled,
    retried,
    failed,
    run: (entries: Entry[]) => runOfflineQueue(entries, {
      execute,
      now,
      onSettled: async (entry, outcome) => { settled.push([entry.id, outcome]); },
      onRetry: async (entry, patch) => { retried.push({ id: entry.id, attempts: patch.attempts, nextAttemptAt: patch.nextAttemptAt }); },
      onFailed: async (entry, patch) => { failed.push({ id: entry.id, attempts: patch.attempts, lastError: patch.lastError }); },
    }),
  };
}

test("classifica erros de rede, sessão, dados inválidos e instabilidade", () => {
  assert.equal(classifyQueueError(new TypeError("Failed to fetch")), "network");
  assert.equal(classifyQueueError({ message: "TypeError: Failed to fetch" }), "network");
  assert.equal(classifyQueueError({ status: 401, message: "unauthorized" }), "auth");
  assert.equal(classifyQueueError({ code: "PGRST301", message: "JWT expired" }), "auth");
  assert.equal(classifyQueueError({ code: "23503", message: "foreign key violation" }), "permanent");
  assert.equal(classifyQueueError({ code: "22P02", message: "invalid input syntax" }), "permanent");
  assert.equal(classifyQueueError({ code: "42501", message: "row-level security" }), "permanent");
  assert.equal(classifyQueueError({ status: 503, message: "unavailable" }), "transient");
  assert.equal(classifyQueueError({ status: 429, message: "too many requests" }), "transient");
  assert.equal(classifyQueueError("algo estranho"), "transient");
});

test("o atraso entre tentativas dobra e tem teto", () => {
  assert.equal(getRetryDelayMs(1), 30_000);
  assert.equal(getRetryDelayMs(2), 60_000);
  assert.equal(getRetryDelayMs(3), 120_000);
  assert.equal(getRetryDelayMs(50), 60 * 60 * 1000);
});

test("uma operação que falha de vez não trava a fila e é marcada como falha", async () => {
  const harness = createHarness(async (entry) => {
    if (entry.id === 1) throw { code: "23503", message: "foreign key violation" };
    return "applied";
  });

  const summary = await harness.run([
    { id: 1, mediaId: "a", kind: "status" },
    { id: 2, mediaId: "b", kind: "status" },
    { id: 3, mediaId: "a", kind: "rating" },
  ]);

  assert.equal(summary.failed, 1);
  assert.equal(summary.applied, 2);
  assert.deepEqual(harness.settled.map(([id]) => id), [2, 3]);
  assert.equal(harness.failed[0]?.id, 1);
});

test("erro transitório agenda nova tentativa e segura só as operações do mesmo item", async () => {
  const harness = createHarness(async (entry) => {
    if (entry.id === 1) throw { status: 503, message: "unavailable" };
    return "applied";
  });

  const summary = await harness.run([
    { id: 1, mediaId: "a", kind: "status" },
    { id: 2, mediaId: "a", kind: "rating" },
    { id: 3, mediaId: "b", kind: "status" },
  ]);

  assert.equal(summary.retrying, 1);
  assert.equal(summary.deferred, 1);
  assert.equal(summary.applied, 1);
  assert.deepEqual(harness.settled.map(([id]) => id), [3]);
  assert.deepEqual(harness.retried, [{ id: 1, attempts: 1, nextAttemptAt: 1_000_000 + 30_000 }]);
});

test("depois de esgotar as tentativas a operação vai para as falhas", async () => {
  const harness = createHarness(async () => { throw { status: 500, message: "boom" }; });

  const summary = await harness.run([{ id: 1, mediaId: "a", kind: "status", attempts: MAX_SYNC_ATTEMPTS - 1 }]);

  assert.equal(summary.failed, 1);
  assert.equal(harness.failed[0]?.attempts, MAX_SYNC_ATTEMPTS);
  assert.equal(harness.retried.length, 0);
});

test("sem rede ou sem sessão a rodada para sem gastar tentativas", async () => {
  const harness = createHarness(async (entry) => {
    if (entry.id === 1) throw new TypeError("Failed to fetch");
    return "applied";
  });

  const summary = await harness.run([
    { id: 1, mediaId: "a", kind: "status" },
    { id: 2, mediaId: "b", kind: "status" },
  ]);

  assert.equal(summary.stoppedBy, "network");
  assert.equal(summary.applied, 0);
  assert.equal(harness.retried.length, 0);
  assert.equal(harness.failed.length, 0);
});

test("operações em espera por backoff e as já falhas são puladas", async () => {
  let executed = 0;
  const harness = createHarness(async () => { executed += 1; return "applied"; });

  const summary = await harness.run([
    { id: 1, mediaId: "a", kind: "status", nextAttemptAt: 1_000_000 + 5_000 },
    { id: 2, mediaId: "a", kind: "rating" },
    { id: 3, mediaId: "b", kind: "status", failedAt: "2026-01-01T00:00:00.000Z" },
    { id: 4, mediaId: "c", kind: "status" },
  ]);

  assert.equal(executed, 1);
  assert.equal(summary.deferred, 2);
  assert.equal(summary.applied, 1);
});

test("conflito e item removido são contados e saem da fila", async () => {
  const outcomes: ExecuteOutcome[] = ["conflict", "gone", "already-applied"];
  const harness = createHarness(async (entry) => outcomes[(entry.id ?? 1) - 1] ?? "applied");

  const summary = await harness.run([
    { id: 1, mediaId: "a", kind: "status" },
    { id: 2, mediaId: "b", kind: "status" },
    { id: 3, mediaId: "c", kind: "status" },
  ]);

  assert.deepEqual([summary.conflicts, summary.gone, summary.applied], [1, 1, 1]);
  assert.equal(harness.settled.length, 3);
});

test("merge por campo: aplica o que o servidor não mexeu e deixa o servidor valer no resto", () => {
  const merge = mergeFields(
    { title: "Base", cover: "a.png", description: "antiga" },
    { title: "Base", cover: "b.png", description: "antiga" },
    { title: "Novo título", cover: "c.png", description: "antiga" },
  );

  assert.deepEqual(merge.apply, ["title"]);
  assert.deepEqual(merge.conflicts, ["cover"]);
});

test("merge por campo: valor que o servidor já tem não gera conflito nem escrita", () => {
  const merge = mergeFields({ rating: "7" }, { rating: 9 }, { rating: "9" });

  assert.deepEqual(merge.apply, []);
  assert.deepEqual(merge.conflicts, []);
});

test("merge por campo: null, undefined e espaços contam como vazio", () => {
  const merge = mergeFields({ meta: "" }, { meta: null }, { meta: "  PC  " });

  assert.deepEqual(merge.apply, ["meta"]);
  assert.deepEqual(merge.conflicts, []);
});

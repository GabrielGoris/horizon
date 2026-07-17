import assert from "node:assert/strict";
import test from "node:test";
import {
  getIncompleteSteamGame,
  needsSteamEnrichment,
  type SteamGameInformation,
} from "../steamEnrichment.ts";
import { isSteamAutoSyncDue, STEAM_AUTO_SYNC_INTERVAL_MS } from "../../src/utils/steamAutoSync.ts";

const completeGame: SteamGameInformation = {
  campaign_hours: 8.5,
  category: "Ação",
  creator: "Horizon Studio",
  description: "Descrição",
  external_id: "10",
  id: "media-10",
  release_year: "2026",
  title: "Horizon Test Game",
};

test("agenda um jogo novo para enriquecimento", () => {
  assert.equal(needsSteamEnrichment(undefined), true);
});

test("não repete enriquecimento depois de uma tentativa concluída", () => {
  assert.equal(needsSteamEnrichment({
    ...completeGame,
    creator: null,
    enrichment_checked_at: "2026-07-16T22:00:00.000Z",
  }), false);
});

test("não enriquece novamente um jogo removido da biblioteca", () => {
  assert.equal(needsSteamEnrichment({
    ...completeGame,
    description: null,
    hidden_at: "2026-07-17T01:00:00.000Z",
  }), false);
});

test("tempo de campanha ausente não força uma nova tentativa", () => {
  assert.equal(needsSteamEnrichment({ ...completeGame, campaign_hours: null }), false);
});

test("mantém jogo sem campos centrais na fila antes da primeira tentativa", () => {
  assert.equal(needsSteamEnrichment({ ...completeGame, description: null }), true);
});

test("descreve os campos que continuam pendentes", () => {
  assert.deepEqual(getIncompleteSteamGame({
    ...completeGame,
    campaign_hours: null,
    category: null,
  }), {
    appId: 10,
    mediaId: "media-10",
    reason: "Faltando: gêneros, tempo de campanha.",
    title: "Horizon Test Game",
  });
});

test("sincroniza automaticamente quando nunca houve sincronização", () => {
  assert.equal(isSteamAutoSyncDue(null), true);
});

test("respeita o intervalo de seis horas", () => {
  const now = Date.parse("2026-07-17T12:00:00.000Z");
  const fiveHoursAgo = new Date(now - 5 * 60 * 60 * 1_000).toISOString();
  const sixHoursAgo = new Date(now - STEAM_AUTO_SYNC_INTERVAL_MS).toISOString();

  assert.equal(isSteamAutoSyncDue(fiveHoursAgo, now), false);
  assert.equal(isSteamAutoSyncDue(sixHoursAgo, now), true);
});

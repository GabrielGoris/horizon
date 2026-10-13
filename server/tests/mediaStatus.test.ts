import assert from "node:assert/strict";
import test from "node:test";
import { getMediaStatusOptions } from "../../src/consts/mediaStatus/index.ts";
import { getCompletionYear } from "../../src/screens/initialScreen/utils/index.ts";
import type { MediaItem } from "../../src/types/index.ts";

test("filtra pelo ano da data real de conclusão em jogos, livros e audiovisual", () => {
  const item = { completed_year: 2025 } as MediaItem;

  assert.equal(getCompletionYear({ ...item, type: "games", completed_at: "2026-03-08" }), "2026");
  assert.equal(getCompletionYear({ ...item, type: "books", completed_at: "08/03/2026" }), "2026");
  assert.equal(getCompletionYear({ ...item, type: "movies", watched_at: "2026-03-08T00:00:00Z" }), "2026");
  assert.equal(getCompletionYear({ ...item, type: "animes" }), "2025");
});

test("oferece incompleto para séries e animes", () => {
  assert.ok(getMediaStatusOptions("movies", "series").includes("incomplete"));
  assert.ok(getMediaStatusOptions("animes", "movie").includes("incomplete"));
});

test("não oferece incompleto para filmes, mas oferece para jogos", () => {
  assert.ok(!getMediaStatusOptions("movies", "movie").includes("incomplete"));
  assert.ok(getMediaStatusOptions("games").includes("incomplete"));
});

test("oferece quero comprar apenas para livros", () => {
  assert.ok(getMediaStatusOptions("books").includes("want_to_buy"));
  assert.ok(!getMediaStatusOptions("animes").includes("want_to_buy"));
  assert.ok(!getMediaStatusOptions("games").includes("want_to_buy"));
  assert.ok(!getMediaStatusOptions("movies", "series").includes("want_to_buy"));
});

test("oferece não planejado apenas para jogos e livros", () => {
  assert.ok(getMediaStatusOptions("games").includes("unplanned"));
  assert.ok(getMediaStatusOptions("books").includes("unplanned"));
  assert.ok(!getMediaStatusOptions("animes").includes("unplanned"));
  assert.ok(!getMediaStatusOptions("movies", "series").includes("unplanned"));
});

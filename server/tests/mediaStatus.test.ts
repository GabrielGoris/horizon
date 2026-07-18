import assert from "node:assert/strict";
import test from "node:test";
import { getMediaStatusOptions } from "../../src/consts/mediaStatus/index.ts";

test("oferece incompleto para séries e animes", () => {
  assert.ok(getMediaStatusOptions("movies", "series").includes("incomplete"));
  assert.ok(getMediaStatusOptions("animes", "movie").includes("incomplete"));
});

test("não oferece incompleto para filmes ou jogos", () => {
  assert.ok(!getMediaStatusOptions("movies", "movie").includes("incomplete"));
  assert.ok(!getMediaStatusOptions("games").includes("incomplete"));
});

test("oferece quero comprar apenas para livros", () => {
  assert.ok(getMediaStatusOptions("books").includes("want_to_buy"));
  assert.ok(!getMediaStatusOptions("animes").includes("want_to_buy"));
  assert.ok(!getMediaStatusOptions("games").includes("want_to_buy"));
  assert.ok(!getMediaStatusOptions("movies", "series").includes("want_to_buy"));
});

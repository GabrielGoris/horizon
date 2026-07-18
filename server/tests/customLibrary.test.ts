import assert from "node:assert/strict";
import test from "node:test";
import {
  getUniqueCustomCategorySlug,
  normalizeCustomCategorySlug,
} from "../../src/services/customLibraryService/helpers/index.ts";

test("normaliza o nome de uma categoria para uma rota estável", () => {
  assert.equal(normalizeCustomCategorySlug("  Restaurantes & Cafés  "), "restaurantes-cafes");
  assert.equal(normalizeCustomCategorySlug("***"), "categoria");
});

test("evita colisões de slug dentro da biblioteca do usuário", () => {
  const existing = ["jogos-de-tabuleiro", "jogos-de-tabuleiro-2", "jogos-de-tabuleiro-3"];

  assert.equal(getUniqueCustomCategorySlug("Jogos de tabuleiro", existing), "jogos-de-tabuleiro-4");
  assert.equal(getUniqueCustomCategorySlug("Restaurantes", existing), "restaurantes");
});

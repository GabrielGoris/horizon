import assert from "node:assert/strict";
import test from "node:test";
import { findDuplicateEntry } from "../../src/utils/customLibrary/duplicates.ts";
import { getCompletionDateField, getCompletionDateValue } from "../../src/utils/customLibrary/completionDate.ts";
import { getCustomFilterFields } from "../../src/screens/initialScreen/components/CustomLibraryFilters/chips.ts";
import type { CustomLibraryCategory } from "../../src/types/customLibrary.ts";

test("usa um campo de data da conclusão como data canônica e não cria filtro duplicado", () => {
  const category = {
    fields: [
      { id: "planned-date", field_type: "date", phase: "planning", label: "Data prevista", options: [] },
      { id: "watched-date", field_type: "date", phase: "completion", label: "Data em que assistiu", options: [] },
    ],
  } as unknown as CustomLibraryCategory;
  assert.equal(getCompletionDateField(category)?.id, "watched-date");
  assert.equal(getCompletionDateValue(category, { "watched-date": "01/07/2026" }, "28/09/2026"), "01/07/2026");
  assert.deepEqual(getCustomFilterFields(category).map((field) => field.id), ["planned-date", "watched-date"]);
  assert.equal(getCustomFilterFields({ ...category, fields: category.fields.slice(0, 1) })[0].id, "completed_at");
});

test("avisa títulos equivalentes sem confundir a própria edição ou nomes distintos", () => {
  const entries = [{ id: "1", title: "Café — Central" }, { id: "2", title: "Café Central 2" }];
  assert.equal(findDuplicateEntry(entries, "  CAFE central ")?.id, "1");
  assert.equal(findDuplicateEntry(entries, "Café — Central", "1"), undefined);
  assert.equal(findDuplicateEntry(entries, "Café Central 2", "1")?.id, "2");
  assert.equal(findDuplicateEntry(entries, "Outro café"), undefined);
  assert.equal(findDuplicateEntry(entries, "---"), undefined);
});
import { matchesFieldFilter, compareCustomEntries } from "../../src/utils/customLibrary/filters.ts";
import type { CustomEntry } from "../../src/types/customLibrary.ts";

test("filtra datas brasileiras e ISO por mês, ano e dia sem inventar mês para ano isolado", () => {
  assert.equal(matchesFieldFilter("15/09/2026", { month: "09", year: "2026" }), true);
  assert.equal(matchesFieldFilter("2026-09-15T00:00:00Z", { date: "2026-09-15" }), true);
  assert.equal(matchesFieldFilter("2025-09-15", { month: "09", year: "2026" }), false);
  assert.equal(matchesFieldFilter("2026", { year: "2026" }), true);
  assert.equal(matchesFieldFilter("2026", { month: "01" }), false);
  assert.equal(matchesFieldFilter(undefined, { year: "2026" }), false);
});

test("combina limites inclusivos e distingue zero, não e campos vazios", () => {
  assert.equal(matchesFieldFilter("0", { min: "0", max: "10" }), true);
  assert.equal(matchesFieldFilter("10.50", { min: "10.50", max: "10.50" }), true);
  assert.equal(matchesFieldFilter("11", { max: "10" }), false);
  assert.equal(matchesFieldFilter("", { max: "10" }), false);
  assert.equal(matchesFieldFilter(false, { boolean: "false" }), true);
  assert.equal(matchesFieldFilter(null, { boolean: "false" }), false);
  assert.equal(matchesFieldFilter(["Centro", "Barato"], { options: ["Centro", "Outro"] }), true);
  assert.equal(matchesFieldFilter(["Caro"], { options: ["Barato"] }), false);
});

test("ordena por adição e mantém datas ausentes no fim em ambas as direções", () => {
  const entries = [
    { title: "Sem data" },
    { title: "Antigo", created_at: "2025-01-01" },
    { title: "Novo", created_at: "2026-01-01" },
  ] as CustomEntry[];
  assert.deepEqual([...entries].sort((a, b) => compareCustomEntries(a, b, "created_desc")).map((entry) => entry.title), ["Novo", "Antigo", "Sem data"]);
  assert.deepEqual([...entries].sort((a, b) => compareCustomEntries(a, b, "created_asc")).map((entry) => entry.title), ["Antigo", "Novo", "Sem data"]);
});
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

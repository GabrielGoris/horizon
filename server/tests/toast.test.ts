import assert from "node:assert/strict";
import test from "node:test";
import { createToastItem, MAX_VISIBLE_TOASTS, toastReducer } from "../../src/components/ToastProvider/utils/index.ts";

test("cria uma notificação informativa com título padrão", () => {
  assert.deepEqual(createToastItem("Biblioteca atualizada.", "toast-1"), {
    id: "toast-1",
    message: "Biblioteca atualizada.",
    title: "Informação",
    tone: "info",
    durationMs: undefined,
  });
});

test("preserva tom, título e duração informados", () => {
  const toast = createToastItem({
    message: "Não foi possível salvar.",
    title: "Registro não salvo",
    tone: "error",
    durationMs: 8_000,
  }, "toast-2");

  assert.equal(toast.title, "Registro não salvo");
  assert.equal(toast.tone, "error");
  assert.equal(toast.durationMs, 8_000);
});

test("mantém apenas as notificações mais recentes", () => {
  const toasts = Array.from({ length: MAX_VISIBLE_TOASTS + 2 }, (_, index) =>
    createToastItem(`Mensagem ${index}`, `toast-${index}`)
  );
  const state = toasts.reduce(
    (currentState, toast) => toastReducer(currentState, { type: "add", toast }),
    [] as typeof toasts,
  );

  assert.equal(state.length, MAX_VISIBLE_TOASTS);
  assert.equal(state[0]?.id, "toast-2");
  assert.equal(state.at(-1)?.id, `toast-${MAX_VISIBLE_TOASTS + 1}`);
});

test("remove uma notificação sem afetar as demais", () => {
  const first = createToastItem("Primeira", "toast-1");
  const second = createToastItem("Segunda", "toast-2");

  assert.deepEqual(toastReducer([first, second], { type: "dismiss", id: first.id }), [second]);
});

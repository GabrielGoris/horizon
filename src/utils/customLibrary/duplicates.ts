export function normalizeEntryTitle(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function findDuplicateEntry<T extends { id: string; title: string }>(entries: T[], title: string, editingId?: string) {
  const normalizedTitle = normalizeEntryTitle(title);
  if (!normalizedTitle) return undefined;
  return entries.find((entry) => entry.id !== editingId && normalizeEntryTitle(entry.title) === normalizedTitle);
}

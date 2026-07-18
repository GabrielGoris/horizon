export function normalizeCustomCategorySlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "categoria";
}

export function getUniqueCustomCategorySlug(name: string, existingSlugs: Iterable<string>) {
  const baseSlug = normalizeCustomCategorySlug(name);
  const existing = new Set(existingSlugs);

  if (!existing.has(baseSlug)) return baseSlug;

  let suffix = 2;
  while (existing.has(`${baseSlug}-${suffix}`)) suffix += 1;

  return `${baseSlug}-${suffix}`;
}

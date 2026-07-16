import type { CreateMediaDTO } from "../../../schemas/media/dto/create-media.dto";
import type { ExistingMediaIdentity } from "../types";

function normalizeIdentityPart(value: string | number | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function optionalIdentityPartMatches(
  existingValue: string | number | null | undefined,
  newValue: string | number | null | undefined,
) {
  const existingPart = normalizeIdentityPart(existingValue);
  const newPart = normalizeIdentityPart(newValue);

  return !existingPart || !newPart || existingPart === newPart;
}

export function isSameMedia(existingItem: ExistingMediaIdentity, newItem: CreateMediaDTO) {
  if (normalizeIdentityPart(existingItem.title) !== normalizeIdentityPart(newItem.title)) return false;
  if (!optionalIdentityPartMatches(existingItem.release_year, newItem.release_year)) return false;

  if (newItem.type === "games") {
    return optionalIdentityPartMatches(existingItem.meta, newItem.meta);
  }

  if (newItem.type === "movies" || newItem.type === "animes") {
    return (existingItem.media_format ?? "movie") === (newItem.media_format ?? "movie");
  }

  return optionalIdentityPartMatches(existingItem.creator, newItem.creator);
}

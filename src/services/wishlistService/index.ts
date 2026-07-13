import { supabase } from "../../lib/supabase";
import type { MediaItem, MediaType } from "../../types";

export const WISHLIST_LIMIT = 10;

export type WishlistPreview = {
  items: MediaItem[];
  removedItem?: MediaItem;
  targetPosition: number;
};

type WishlistPositionUpdate = {
  id: string;
  position: number | null;
  added_at?: string | null;
};

async function saveWishlistPositions(updates: WishlistPositionUpdate[]) {
  const { error } = await supabase.rpc("set_wishlist_positions", {
    p_updates: updates,
  });

  if (error) throw error;
}

function getWishlistPosition(item: MediaItem) {
  const position = Number(item.wishlist_position);

  return Number.isFinite(position) ? position : null;
}

function normalizeWishlistPosition(position: number) {
  if (!Number.isFinite(position)) return 1;

  return Math.min(WISHLIST_LIMIT, Math.max(1, Math.round(position)));
}

export function getWishlistItems(collection: MediaItem[], mediaType: MediaType) {
  return collection
    .filter((item) => item.type === mediaType && getWishlistPosition(item) !== null)
    .sort((firstItem, secondItem) => Number(firstItem.wishlist_position) - Number(secondItem.wishlist_position));
}

export function buildWishlistPreview(
  collection: MediaItem[],
  item: MediaItem,
  position: number
): WishlistPreview {
  const targetPosition = normalizeWishlistPosition(position);
  const currentWishlist = getWishlistItems(collection, item.type).filter((wishlistItem) => wishlistItem.id !== item.id);
  const nextWishlist = [...currentWishlist];

  nextWishlist.splice(targetPosition - 1, 0, item);

  return {
    items: nextWishlist.slice(0, WISHLIST_LIMIT),
    removedItem: nextWishlist[WISHLIST_LIMIT],
    targetPosition,
  };
}

export async function saveWishlistPreview(preview: WishlistPreview) {
  const now = new Date().toISOString();
  const updates: WishlistPositionUpdate[] = preview.items.map((item, index) => ({
    id: item.id,
    position: index + 1,
    added_at: item.wishlist_added_at ?? now,
  }));

  if (preview.removedItem) {
    updates.push({
      id: preview.removedItem.id,
      position: null,
      added_at: null,
    });
  }

  await saveWishlistPositions(updates);
}

export async function moveMediaToWishlist(collection: MediaItem[], item: MediaItem, position: number) {
  const preview = buildWishlistPreview(collection, item, position);

  await saveWishlistPreview(preview);

  return preview;
}

export async function removeMediaFromWishlist(collection: MediaItem[], item: MediaItem) {
  const currentWishlist = getWishlistItems(collection, item.type).filter((wishlistItem) => wishlistItem.id !== item.id);
  const updates: WishlistPositionUpdate[] = currentWishlist.map((wishlistItem, index) => ({
    id: wishlistItem.id,
    position: index + 1,
  }));

  updates.push({ id: item.id, position: null, added_at: null });
  await saveWishlistPositions(updates);
}

import type { MediaItem } from "../../../types";

export type OfflineMediaOperation =
  | { kind: 'create'; mediaId: string; payload: unknown }
  | { kind: 'complete'; mediaId: string }
  | { kind: 'status'; mediaId: string; payload: unknown }
  | { kind: 'meta'; mediaId: string; payload: unknown }
  | { kind: 'details'; mediaId: string; payload: unknown }
  | { kind: 'delete'; mediaId: string; payload: unknown }
  | { kind: 'audiovisual-completion'; mediaId: string; payload: unknown }
  | { kind: 'book-completion'; mediaId: string; payload: unknown }
  | { kind: 'game-completion'; mediaId: string; payload: unknown }

export type CachedMediaSnapshot = {
  userId: string
  items: MediaItem[]
  updatedAt: string
}

export type QueuedOperation = OfflineMediaOperation & {
  id?: number
  userId: string
  createdAt: string
}
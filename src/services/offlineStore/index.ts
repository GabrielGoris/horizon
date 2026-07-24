import type { MediaItem } from '../../types'
import type { CachedMediaItem, CachedMediaMetadata, CachedMediaSnapshot, OfflineMediaOperation, QueuedOperation } from './types'

const DATABASE_NAME = 'horizon-offline'
const DATABASE_VERSION = 2
const LEGACY_MEDIA_STORE = 'media'
const MEDIA_ITEMS_STORE = 'media-items'
const MEDIA_METADATA_STORE = 'media-metadata'
const QUEUE_STORE = 'queue'

function getMediaCacheKey(userId: string, mediaId: string) {
  return `${userId}:${mediaId}`
}

function sortCachedMedia(items: MediaItem[]) {
  return [...items].sort((firstItem, secondItem) => {
    const firstDate = firstItem.created_at ?? firstItem.added_at ?? ''
    const secondDate = secondItem.created_at ?? secondItem.added_at ?? ''

    return secondDate.localeCompare(firstDate) || firstItem.title.localeCompare(secondItem.title, 'pt-BR')
  })
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

    request.onupgradeneeded = (event) => {
      const database = request.result
      const transaction = request.transaction

      if (!database.objectStoreNames.contains(LEGACY_MEDIA_STORE)) {
        database.createObjectStore(LEGACY_MEDIA_STORE, { keyPath: 'userId' })
      }

      if (!database.objectStoreNames.contains(MEDIA_ITEMS_STORE)) {
        const mediaItems = database.createObjectStore(MEDIA_ITEMS_STORE, { keyPath: 'key' })
        mediaItems.createIndex('by-user', 'userId', { unique: false })
      }

      if (!database.objectStoreNames.contains(MEDIA_METADATA_STORE)) {
        database.createObjectStore(MEDIA_METADATA_STORE, { keyPath: 'userId' })
      }

      if (!database.objectStoreNames.contains(QUEUE_STORE)) {
        const queue = database.createObjectStore(QUEUE_STORE, { keyPath: 'id', autoIncrement: true })
        queue.createIndex('by-user', 'userId', { unique: false })
      }

      if (event.oldVersion < 2 && transaction) {
        const legacyMedia = transaction.objectStore(LEGACY_MEDIA_STORE)
        const mediaItems = transaction.objectStore(MEDIA_ITEMS_STORE)
        const metadata = transaction.objectStore(MEDIA_METADATA_STORE)
        const legacySnapshotRequest = legacyMedia.getAll() as IDBRequest<CachedMediaSnapshot[]>

        legacySnapshotRequest.onsuccess = () => {
          for (const snapshot of legacySnapshotRequest.result ?? []) {
            const updatedAt = snapshot.updatedAt ?? new Date().toISOString()

            for (const item of snapshot.items ?? []) {
              mediaItems.put({
                key: getMediaCacheKey(snapshot.userId, item.id),
                userId: snapshot.userId,
                item,
                updatedAt,
              } satisfies CachedMediaItem)
            }

            metadata.put({ userId: snapshot.userId, updatedAt } satisfies CachedMediaMetadata)
          }
        }
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Não foi possível abrir o armazenamento local.'))
  })
}

async function requestResult<T>(mode: IDBTransactionMode, storeName: string, action: (store: IDBObjectStore) => IDBRequest<T>) {
  const database = await openDatabase()

  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(storeName, mode)
    const request = action(transaction.objectStore(storeName))

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Não foi possível atualizar o armazenamento local.'))
    transaction.oncomplete = () => database.close()
    transaction.onerror = () => {
      database.close()
      reject(transaction.error ?? new Error('Não foi possível atualizar o armazenamento local.'))
    }
  })
}

async function readMediaCacheRows(userId: string) {
  const database = await openDatabase()

  return new Promise<CachedMediaItem[]>((resolve, reject) => {
    const transaction = database.transaction(MEDIA_ITEMS_STORE, 'readonly')
    const request = transaction.objectStore(MEDIA_ITEMS_STORE).index('by-user').getAll(userId) as IDBRequest<CachedMediaItem[]>

    request.onsuccess = () => resolve(request.result ?? [])
    request.onerror = () => reject(request.error ?? new Error('Não foi possí­vel ler o armazenamento local.'))
    transaction.oncomplete = () => database.close()
    transaction.onerror = () => {
      database.close()
      reject(transaction.error ?? new Error('Não foi possí­vel ler o armazenamento local.'))
    }
  })
}

async function getMediaCacheMetadata(userId: string) {
  return requestResult<CachedMediaMetadata | undefined>('readonly', MEDIA_METADATA_STORE, (store) => store.get(userId))
}

export function isNetworkAvailable() {
  return typeof navigator === 'undefined' || navigator.onLine
}

export async function readCachedMedia(userId: string) {
  const cached = await readCachedMediaSnapshot(userId)
  return cached?.items ?? []
}

export async function readCachedMediaSnapshot(userId: string) {
  const [rows, metadata] = await Promise.all([readMediaCacheRows(userId), getMediaCacheMetadata(userId)])
  if (!metadata && rows.length === 0) return undefined

  return {
    userId,
    items: sortCachedMedia(rows.map((row) => row.item)),
    updatedAt: metadata?.updatedAt ?? rows.reduce((latest, row) => latest > row.updatedAt ? latest : row.updatedAt, ''),
  } satisfies CachedMediaSnapshot
}

export async function writeCachedMedia(userId: string, items: MediaItem[]) {
  const database = await openDatabase()
  const updatedAt = new Date().toISOString()

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction([LEGACY_MEDIA_STORE, MEDIA_ITEMS_STORE, MEDIA_METADATA_STORE], 'readwrite')
    const mediaItems = transaction.objectStore(MEDIA_ITEMS_STORE)
    const existingMedia = mediaItems.index('by-user').openKeyCursor(IDBKeyRange.only(userId))

    existingMedia.onsuccess = () => {
      const cursor = existingMedia.result
      if (cursor) {
        mediaItems.delete(cursor.primaryKey)
        cursor.continue()
        return
      }

      for (const item of items) {
        mediaItems.put({
          key: getMediaCacheKey(userId, item.id),
          userId,
          item,
          updatedAt,
        } satisfies CachedMediaItem)
      }

      transaction.objectStore(MEDIA_METADATA_STORE).put({ userId, updatedAt } satisfies CachedMediaMetadata)
      transaction.objectStore(LEGACY_MEDIA_STORE).delete(userId)
    }
    existingMedia.onerror = () => reject(existingMedia.error ?? new Error('NÃ£o foi possÃ­vel limpar o armazenamento local.'))

    transaction.oncomplete = () => {
      database.close()
      resolve()
    }
    transaction.onerror = () => {
      database.close()
      reject(transaction.error ?? new Error('Não foi possível atualizar o armazenamento local.'))
    }
  })
}

export async function upsertCachedMedia(userId: string, item: MediaItem) {
  const updatedAt = new Date().toISOString()
  const database = await openDatabase()

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction([MEDIA_ITEMS_STORE, MEDIA_METADATA_STORE], 'readwrite')
    transaction.objectStore(MEDIA_ITEMS_STORE).put({
      key: getMediaCacheKey(userId, item.id),
      userId,
      item,
      updatedAt,
    } satisfies CachedMediaItem)
    transaction.objectStore(MEDIA_METADATA_STORE).put({ userId, updatedAt } satisfies CachedMediaMetadata)
    transaction.oncomplete = () => {
      database.close()
      resolve()
    }
    transaction.onerror = () => {
      database.close()
      reject(transaction.error ?? new Error('Não foi possí­vel atualizar o armazenamento local.'))
    }
  })
}

export async function upsertCachedMediaBatch(userId: string, items: MediaItem[]) {
  if (!items.length) return

  const updatedAt = new Date().toISOString()
  const database = await openDatabase()

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction([MEDIA_ITEMS_STORE, MEDIA_METADATA_STORE], 'readwrite')
    const mediaItems = transaction.objectStore(MEDIA_ITEMS_STORE)

    for (const item of items) {
      mediaItems.put({
        key: getMediaCacheKey(userId, item.id),
        userId,
        item,
        updatedAt,
      } satisfies CachedMediaItem)
    }

    transaction.objectStore(MEDIA_METADATA_STORE).put({ userId, updatedAt } satisfies CachedMediaMetadata)
    transaction.oncomplete = () => {
      database.close()
      resolve()
    }
    transaction.onerror = () => {
      database.close()
      reject(transaction.error ?? new Error('Não foi possí­vel atualizar o armazenamento local.'))
    }
  })
}

export async function updateCachedMediaItem(userId: string, itemId: string, update: (item: MediaItem) => MediaItem) {
  const database = await openDatabase()
  const key = getMediaCacheKey(userId, itemId)

  return new Promise<MediaItem | null>((resolve, reject) => {
    const transaction = database.transaction([MEDIA_ITEMS_STORE, MEDIA_METADATA_STORE], 'readwrite')
    const store = transaction.objectStore(MEDIA_ITEMS_STORE)
    const request = store.get(key) as IDBRequest<CachedMediaItem | undefined>
    let updatedItem: MediaItem | null = null

    request.onsuccess = () => {
      const current = request.result
      if (!current) return

      updatedItem = update(current.item)
      const updatedAt = new Date().toISOString()
      store.put({ ...current, item: updatedItem, updatedAt })
      transaction.objectStore(MEDIA_METADATA_STORE).put({ userId, updatedAt } satisfies CachedMediaMetadata)
    }
    request.onerror = () => reject(request.error ?? new Error('NÃ£o foi possÃ­vel atualizar o armazenamento local.'))
    transaction.oncomplete = () => {
      database.close()
      resolve(updatedItem)
    }
    transaction.onerror = () => {
      database.close()
      reject(transaction.error ?? new Error('Não foi possí­vel atualizar o armazenamento local.'))
    }
  })
}

export async function removeCachedMedia(userId: string, itemId: string) {
  const updatedAt = new Date().toISOString()
  const database = await openDatabase()

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction([MEDIA_ITEMS_STORE, MEDIA_METADATA_STORE], 'readwrite')
    transaction.objectStore(MEDIA_ITEMS_STORE).delete(getMediaCacheKey(userId, itemId))
    transaction.objectStore(MEDIA_METADATA_STORE).put({ userId, updatedAt } satisfies CachedMediaMetadata)
    transaction.oncomplete = () => {
      database.close()
      resolve()
    }
    transaction.onerror = () => {
      database.close()
      reject(transaction.error ?? new Error('Não foi possí­vel atualizar o armazenamento local.'))
    }
  })
}

export async function enqueueOfflineOperation(userId: string, operation: OfflineMediaOperation) {
  await requestResult<IDBValidKey>('readwrite', QUEUE_STORE, (store) => store.add({ ...operation, userId, createdAt: new Date().toISOString() } satisfies QueuedOperation))
}

export async function getQueuedOperations(userId: string) {
  const database = await openDatabase()

  return new Promise<QueuedOperation[]>((resolve, reject) => {
    const transaction = database.transaction(QUEUE_STORE, 'readonly')
    const request = transaction.objectStore(QUEUE_STORE).index('by-user').getAll(userId)

    request.onsuccess = () => resolve((request.result ?? []).sort((first, second) => (first.id ?? 0) - (second.id ?? 0)))
    request.onerror = () => reject(request.error ?? new Error('Não foi possível ler a fila de sincronização.'))
    transaction.oncomplete = () => database.close()
  })
}

export async function removeQueuedOperation(id: number) {
  await requestResult<undefined>('readwrite', QUEUE_STORE, (store) => store.delete(id))
}

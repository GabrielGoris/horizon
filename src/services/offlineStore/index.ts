import type { MediaItem } from '../../types'

const DATABASE_NAME = 'horizon-offline'
const DATABASE_VERSION = 1
const MEDIA_STORE = 'media'
const QUEUE_STORE = 'queue'

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

type CachedMedia = {
  userId: string
  items: MediaItem[]
  updatedAt: string
}

type QueuedOperation = OfflineMediaOperation & {
  id?: number
  userId: string
  createdAt: string
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains(MEDIA_STORE)) {
        database.createObjectStore(MEDIA_STORE, { keyPath: 'userId' })
      }

      if (!database.objectStoreNames.contains(QUEUE_STORE)) {
        const queue = database.createObjectStore(QUEUE_STORE, { keyPath: 'id', autoIncrement: true })
        queue.createIndex('by-user', 'userId', { unique: false })
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

export function isNetworkAvailable() {
  return typeof navigator === 'undefined' || navigator.onLine
}

export async function readCachedMedia(userId: string) {
  const cached = await requestResult<CachedMedia | undefined>('readonly', MEDIA_STORE, (store) => store.get(userId))
  return cached?.items ?? []
}

export async function writeCachedMedia(userId: string, items: MediaItem[]) {
  await requestResult<IDBValidKey>('readwrite', MEDIA_STORE, (store) => store.put({ userId, items, updatedAt: new Date().toISOString() } satisfies CachedMedia))
}

export async function updateCachedMedia(userId: string, update: (items: MediaItem[]) => MediaItem[]) {
  const currentItems = await readCachedMedia(userId)
  const nextItems = update(currentItems)
  await writeCachedMedia(userId, nextItems)
  return nextItems
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

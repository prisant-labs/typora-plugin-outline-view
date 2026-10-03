import type { UpdateRecord, UpdateRecordStore } from './update-check'

const KEY = 'updates'

function normalize(value: unknown): UpdateRecord {
  const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const record: UpdateRecord = { checkForUpdates: typeof raw.checkForUpdates === 'boolean' ? raw.checkForUpdates : true }
  const checked = raw.checked && typeof raw.checked === 'object' ? raw.checked as Record<string, unknown> : undefined
  if (checked && typeof checked.at === 'number' && Number.isFinite(checked.at)) {
    record.checked = typeof checked.version === 'string' ? { at: checked.at, version: checked.version } : { at: checked.at }
  }
  return record
}

/**
 * The update setting and the last completed check, in Outline View's own IndexedDB database.
 * Kept out of PluginSettings: every window and vault shares one record, and an older
 * Outline View reads its settings file unchanged.
 */
export class UpdateStore implements UpdateRecordStore {
  private connection?: Promise<IDBDatabase>

  constructor(private readonly databaseName = 'prisant-labs.outline-view') {}

  /** Never rejects: an unreadable record reads as automatic checks on and no previous check. */
  async read(): Promise<UpdateRecord> {
    try {
      const database = await this.open()
      return await new Promise<UpdateRecord>((resolve, reject) => {
        const request = database.transaction('state', 'readonly').objectStore('state').get(KEY)
        request.onsuccess = () => resolve(normalize(request.result))
        request.onerror = () => reject(request.error)
      })
    } catch { return normalize(undefined) }
  }

  /** Reads, changes and writes the record in one transaction, so two windows never overwrite each other's change. */
  async update(change: (record: UpdateRecord) => UpdateRecord): Promise<UpdateRecord> {
    const database = await this.open()
    return new Promise<UpdateRecord>((resolve, reject) => {
      const transaction = database.transaction('state', 'readwrite')
      const store = transaction.objectStore('state')
      let result: UpdateRecord, failure: unknown
      transaction.oncomplete = () => resolve(result)
      transaction.onabort = () => reject(failure ?? transaction.error ?? new Error('The update setting could not be saved.'))
      const request = store.get(KEY)
      request.onsuccess = () => {
        try {
          result = normalize(change(normalize(request.result)))
          store.put(result, KEY)
        } catch (error) { failure = error; transaction.abort() }
      }
    })
  }

  async close(): Promise<void> {
    const connection = this.connection
    this.connection = undefined
    if (connection) (await connection.catch(() => undefined))?.close()
  }

  private open(): Promise<IDBDatabase> {
    if (!this.connection) {
      const connection = new Promise<IDBDatabase>((resolve, reject) => {
        if (!globalThis.indexedDB) { reject(new Error('IndexedDB storage is unavailable in this Typora window')); return }
        const request = indexedDB.open(this.databaseName, 1)
        // Whichever window opens a new database first creates the object store.
        request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('state')) request.result.createObjectStore('state') }
        request.onsuccess = () => {
          const database = request.result
          const invalidate = () => { if (this.connection === connection) this.connection = undefined }
          database.onclose = invalidate
          database.onversionchange = () => { database.close(); invalidate() }
          resolve(database)
        }
        request.onerror = () => reject(request.error ?? new Error('Could not open Outline View storage'))
        request.onblocked = () => reject(new Error('Outline View storage is blocked by another window'))
      })
      this.connection = connection
      void connection.catch(() => { if (this.connection === connection) this.connection = undefined })
    }
    return this.connection
  }
}

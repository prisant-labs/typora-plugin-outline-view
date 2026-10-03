import { IDBFactory } from 'fake-indexeddb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UpdateStore } from './update-store'

const DATABASE = 'outline-view-update-synthetic-test'
const stores: Array<{ close(): Promise<void> }> = []
beforeEach(() => { vi.stubGlobal('indexedDB', new IDBFactory()) })
afterEach(async () => {
  await Promise.all(stores.splice(0).map(store => store.close()))
  vi.unstubAllGlobals()
})
function track<T extends { close(): Promise<void> }>(store: T) { stores.push(store); return store }

async function putRaw(key: string, value: unknown) {
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1)
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('state')) request.result.createObjectStore('state') }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction('state', 'readwrite')
    transaction.objectStore('state').put(value, key)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
  database.close()
}

describe('UpdateStore', () => {
  it('reads automatic checks as on when nothing is stored', async () => {
    const store = track(new UpdateStore(DATABASE))
    await expect(store.read()).resolves.toEqual({ checkForUpdates: true })
  })

  it('round-trips the setting and the last completed check', async () => {
    const store = track(new UpdateStore(DATABASE))
    await expect(store.update(() => ({ checkForUpdates: false, checked: { at: 1_790_000_000_000, version: '0.3.4' } }))).resolves.toEqual({ checkForUpdates: false, checked: { at: 1_790_000_000_000, version: '0.3.4' } })
    await expect(track(new UpdateStore(DATABASE)).read()).resolves.toEqual({ checkForUpdates: false, checked: { at: 1_790_000_000_000, version: '0.3.4' } })
  })

  it('keeps its record in Outline View\'s own database by default', async () => {
    const store = track(new UpdateStore())
    await store.update(() => ({ checkForUpdates: false }))
    expect((await indexedDB.databases()).map(database => database.name)).toEqual(['prisant-labs.outline-view'])
    await expect(track(new UpdateStore('prisant-labs.outline-view')).read()).resolves.toEqual({ checkForUpdates: false })
  })

  it('reads a malformed record as safe defaults', async () => {
    const cases: Array<[unknown, unknown]> = [
      ['garbage', { checkForUpdates: true }],
      [{ checkForUpdates: 'no' }, { checkForUpdates: true }],
      [{ checkForUpdates: false, checked: { at: 'yesterday' } }, { checkForUpdates: false }],
      [{ checkForUpdates: false, checked: { at: 5, version: 7 } }, { checkForUpdates: false, checked: { at: 5 } }],
      [{ checkForUpdates: false, checked: { at: Number.NaN } }, { checkForUpdates: false }],
    ]
    for (const [raw, expected] of cases) {
      await putRaw('updates', raw)
      const store = track(new UpdateStore(DATABASE))
      await expect(store.read()).resolves.toEqual(expected)
      await store.close()
    }
  })

  it('reads defaults and rejects writes when IndexedDB is unavailable', async () => {
    vi.stubGlobal('indexedDB', undefined)
    const store = track(new UpdateStore(DATABASE))
    await expect(store.read()).resolves.toEqual({ checkForUpdates: true })
    await expect(store.update(() => ({ checkForUpdates: false }))).rejects.toThrow()
  })

  it('applies concurrent changes from two windows without losing either', async () => {
    const first = track(new UpdateStore(DATABASE)), second = track(new UpdateStore(DATABASE))
    await Promise.all([
      first.update(record => ({ ...record, checked: { at: 7, version: '0.3.4' } })),
      second.update(record => ({ ...record, checkForUpdates: false })),
    ])
    await expect(first.read()).resolves.toEqual({ checkForUpdates: false, checked: { at: 7, version: '0.3.4' } })
  })

  it('aborts the change when the callback throws', async () => {
    const store = track(new UpdateStore(DATABASE))
    await store.update(() => ({ checkForUpdates: false }))
    await expect(store.update(() => { throw new Error('Synthetic failure') })).rejects.toThrow('Synthetic failure')
    await expect(store.read()).resolves.toEqual({ checkForUpdates: false })
  })

  it('opens a database that another window already created', async () => {
    await putRaw('other', 1)
    const store = track(new UpdateStore(DATABASE))
    await store.update(() => ({ checkForUpdates: false }))
    await expect(track(new UpdateStore(DATABASE)).read()).resolves.toEqual({ checkForUpdates: false })
  })
})

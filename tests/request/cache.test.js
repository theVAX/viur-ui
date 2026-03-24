import { describe, it, expect, beforeEach, vi } from 'vitest'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { getCached, setCached, invalidateByKey, clearCache } from '../../src/request/cache.js'

// Reset IndexedDB and module-level state before each test
beforeEach(async () => {
  globalThis.indexedDB = new IDBFactory()
  globalThis.IDBKeyRange = IDBKeyRange
  await clearCache()
})

// ─── getCached / setCached ────────────────────────────────────────────────────

describe('getCached', () => {
  it('returns null for missing key', async () => {
    expect(await getCached('http://api.test/missing')).toBeNull()
  })

  it('returns cached data', async () => {
    await setCached('http://api.test/a', { hello: 'world' })
    expect(await getCached('http://api.test/a')).toEqual({ hello: 'world' })
  })

  it('returns null when entry is expired (ttl in seconds)', async () => {
    await setCached('http://api.test/b', { v: 1 })
    // Simulate entry being old by mocking Date.now
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 2 * 1000)
    expect(await getCached('http://api.test/b', 1)).toBeNull()
    vi.restoreAllMocks()
  })

  it('returns data when entry is within ttl', async () => {
    await setCached('http://api.test/c', { v: 2 })
    expect(await getCached('http://api.test/c', 3600)).toEqual({ v: 2 })
  })

  it('never expires when ttl=0', async () => {
    await setCached('http://api.test/d', { v: 3 })
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 99999 * 1000)
    expect(await getCached('http://api.test/d', 0)).toEqual({ v: 3 })
    vi.restoreAllMocks()
  })

  it('deletes the entry after expiry so subsequent GET returns null', async () => {
    await setCached('http://api.test/e', { v: 4 })
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 10 * 1000)
    await getCached('http://api.test/e', 5)
    vi.restoreAllMocks()
    expect(await getCached('http://api.test/e')).toBeNull()
  })
})

// ─── invalidateByKey ─────────────────────────────────────────────────────────

describe('invalidateByKey', () => {
  it('removes cache entries associated with an entity key', async () => {
    await setCached('http://api.test/list?k=1', { skellist: [{ key: 'ent1' }] }, ['ent1'])
    await invalidateByKey('ent1')
    expect(await getCached('http://api.test/list?k=1', 0)).toBeNull()
  })

  it('accepts an array of entity keys', async () => {
    await setCached('http://api.test/list?k=2', { skellist: [] }, ['ent2', 'ent3'])
    await invalidateByKey(['ent2', 'ent3'])
    expect(await getCached('http://api.test/list?k=2', 0)).toBeNull()
  })

  it('is a no-op for unknown entity key', async () => {
    await setCached('http://api.test/list?k=3', { skellist: [] }, ['ent4'])
    await invalidateByKey('unknown-key')
    expect(await getCached('http://api.test/list?k=3', 0)).toEqual({ skellist: [] })
  })

  it('rebuilds key mappings from IndexedDB after a clearCache call', async () => {
    await setCached('http://api.test/view/ent5', { values: { key: 'ent5' } }, ['ent5'])

    // clearCache resets _keyMappingsLoaded, forcing a rebuild on next invalidate
    await clearCache()
    await setCached('http://api.test/view/ent5', { values: { key: 'ent5' } }, ['ent5'])

    await invalidateByKey('ent5')
    expect(await getCached('http://api.test/view/ent5', 0)).toBeNull()
  })

  it('only removes entries for the invalidated key, not others', async () => {
    await setCached('http://api.test/a', {}, ['entA'])
    await setCached('http://api.test/b', {}, ['entB'])
    await invalidateByKey('entA')
    expect(await getCached('http://api.test/a', 0)).toBeNull()
    expect(await getCached('http://api.test/b', 0)).toEqual({})
  })
})

// ─── clearCache ───────────────────────────────────────────────────────────────

describe('clearCache', () => {
  it('clears all entries when called without prefix', async () => {
    await setCached('http://api.test/x', { a: 1 })
    await setCached('http://api.test/y', { b: 2 })
    await clearCache()
    expect(await getCached('http://api.test/x', 0)).toBeNull()
    expect(await getCached('http://api.test/y', 0)).toBeNull()
  })

  it('only removes entries matching the prefix', async () => {
    await setCached('http://api.test/json/users/list', { users: [] })
    await setCached('http://api.test/json/posts/list', { posts: [] })
    await clearCache('http://api.test/json/users/')
    expect(await getCached('http://api.test/json/users/list', 0)).toBeNull()
    expect(await getCached('http://api.test/json/posts/list', 0)).toEqual({ posts: [] })
  })

  it('does nothing when prefix matches nothing', async () => {
    await setCached('http://api.test/json/items/list', { items: [] })
    await clearCache('http://api.test/json/other/')
    expect(await getCached('http://api.test/json/items/list', 0)).toEqual({ items: [] })
  })

  it('also invalidates key-to-cache mappings on full clear', async () => {
    await setCached('http://api.test/view/ent6', {}, ['ent6'])
    await clearCache()
    // After full clear, entity key should no longer point to anything
    await setCached('http://api.test/view/ent6', { fresh: true }, ['ent6'])
    await invalidateByKey('ent6')
    expect(await getCached('http://api.test/view/ent6', 0)).toBeNull()
  })
})

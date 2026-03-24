const MAX_CACHE_ENTRIES = 1000
const DEFAULT_TTL = 60 * 60 * 24 // 24h in seconds
const DB_NAME = "viur-request-cache"
const DB_VERSION = 1
const STORE_NAME = "requests"

let _db = null

async function _openDb() {
  if (_db) return _db
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "cacheKey" })
      }
    }
    req.onsuccess = (e) => { _db = e.target.result; resolve(_db) }
    req.onerror = () => reject(req.error)
  })
}

async function _dbGet(cacheKey) {
  const db = await _openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const req = tx.objectStore(STORE_NAME).get(cacheKey)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => reject(req.error)
  })
}

async function _dbPut(entry) {
  const db = await _openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).put(entry)
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  })
}

async function _dbDelete(cacheKey) {
  const db = await _openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).delete(cacheKey)
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  })
}

async function _dbGetAll() {
  const db = await _openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function _dbClear() {
  const db = await _openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).clear()
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  })
}

async function _trimCache() {
  const all = await _dbGetAll()
  if (all.length <= MAX_CACHE_ENTRIES) return
  all.sort((a, b) => a.date - b.date)
  const toDelete = all.slice(0, all.length - MAX_CACHE_ENTRIES)
  for (const entry of toDelete) {
    await _dbDelete(entry.cacheKey)
  }
}

// keyToCache maps entity keys (e.g. viur db keys) to cache keys for invalidation
// In-memory only — rebuilt lazily from IndexedDB after page reload
const _keyToCache = new Map()
let _keyMappingsLoaded = false

function _registerKeyMapping(entityKey, cacheKey) {
  if (!_keyToCache.has(entityKey)) _keyToCache.set(entityKey, new Set())
  _keyToCache.get(entityKey).add(cacheKey)
}

async function _ensureKeyMappings() {
  if (_keyMappingsLoaded) return
  const all = await _dbGetAll()
  for (const entry of all) {
    for (const key of (entry.entityKeys ?? [])) {
      _registerKeyMapping(key, entry.cacheKey)
    }
  }
  _keyMappingsLoaded = true
}

/**
 * Get cached response for a URL.
 * Returns null if not cached or expired.
 * @param {string} url
 * @param {number} ttl - TTL in seconds (0 = no expiry)
 */
if (typeof window !== "undefined" && window.location.hostname === "localhost") {
  clearCache().catch(() => {})
}

export async function getCached(url, ttl = DEFAULT_TTL) {
  const entry = await _dbGet(url)
  if (!entry) return null
  if (ttl > 0 && Date.now() - entry.date > ttl * 1000) {
    await _dbDelete(url)
    return null
  }
  return entry.data
}

/**
 * Store a response in cache.
 * @param {string} url
 * @param {any} data
 * @param {string[]} [entityKeys] - viur entity keys contained in the response (for invalidation)
 */
export async function setCached(url, data, entityKeys = []) {
  await _dbPut({ cacheKey: url, data, date: Date.now(), entityKeys })
  for (const key of entityKeys) {
    _registerKeyMapping(key, url)
  }
  await _trimCache()
}

/**
 * Invalidate cache entries associated with an entity key.
 * Called after edit/delete/add.
 * @param {string|string[]} entityKeys
 */
export async function invalidateByKey(entityKeys) {
  await _ensureKeyMappings()
  const keys = Array.isArray(entityKeys) ? entityKeys : [entityKeys]
  for (const entityKey of keys) {
    const cacheKeys = _keyToCache.get(entityKey)
    if (!cacheKeys) continue
    for (const cacheKey of cacheKeys) {
      await _dbDelete(cacheKey)
    }
    _keyToCache.delete(entityKey)
  }
}

/**
 * Clear cached entries.
 * @param {string} [prefix] - If given, only entries whose cache key starts with this prefix are removed.
 *                            If omitted, all entries are cleared.
 */
export async function clearCache(prefix) {
  if (prefix === undefined) {
    _keyToCache.clear()
    _keyMappingsLoaded = false
    await _dbClear()
    return
  }
  _keyMappingsLoaded = false
  const all = await _dbGetAll()
  for (const entry of all) {
    if (entry.cacheKey.startsWith(prefix)) {
      await _dbDelete(entry.cacheKey)
      for (const [entityKey, cacheKeys] of _keyToCache) {
        cacheKeys.delete(entry.cacheKey)
        if (cacheKeys.size === 0) _keyToCache.delete(entityKey)
      }
    }
  }
}

import { IDBFactory, IDBKeyRange } from "fake-indexeddb"

// Provide fake IndexedDB for all tests
globalThis.indexedDB = new IDBFactory()
globalThis.IDBKeyRange = IDBKeyRange

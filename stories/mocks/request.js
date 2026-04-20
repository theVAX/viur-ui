import { ref } from 'vue'

const MOCK_SKELLIST = {
  article: [
    { key: 'ag9zfnZpdXItdGVzdHIRCxIHQXJ0aWNsZRiAgICAgICAgAoM', name: 'Beispiel-Artikel' },
    { key: 'art2', name: 'Weiterer Artikel' },
    { key: 'art3', name: 'Dritter Artikel' },
  ],
}

const DEFAULT_ITEMS = [
  { key: 'item1', name: 'Eintrag 1' },
  { key: 'item2', name: 'Eintrag 2' },
]

export function useListFetch(module) {
  const items = MOCK_SKELLIST[module] ?? DEFAULT_ITEMS
  const data = ref(items)
  return {
    data,
    execute: async () => {},
  }
}

export function downloadUrlFor(bone) {
  if (bone && typeof bone === 'object' && 'dest' in bone) {
    return bone.dest.downloadUrl ?? null
  }
  return null
}

export async function uploadFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      resolve({
        key: 'mock-' + Date.now(),
        name: encodeURIComponent(file.name),
        mimetype: file.type,
        size: file.size,
        downloadUrl: e.target.result,
      })
    }
    reader.readAsDataURL(file)
  })
}

export function serveUrlFor() { return null }
export function resetState() {}
export class HTTPError extends Error {}
export function createControllerFetch() { return { execute: async () => {}, data: ref(null) } }
export function useAddFetch() { return { execute: async () => {}, data: ref(null) } }
export function useDeleteFetch() { return { execute: async () => {}, data: ref(null) } }
export function useEditFetch() { return { execute: async () => {}, data: ref(null) } }
export function useListFetchAll() { return { execute: async () => {}, data: ref([]) } }
export function useViewFetch() { return { execute: async () => {}, data: ref(null) } }
export function useStructureFetch() { return { execute: async () => {}, data: ref(null) } }

// cache.js re-exports
export function getCached() { return null }
export function setCached() {}
export function invalidateByKey() {}
export function clearCache() {}

// skel.js re-exports
export function skelDataToFormData() { return new FormData() }

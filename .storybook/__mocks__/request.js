// Storybook mock for src/request/index.js
// uploadFile: simulates a successful upload using a local blob URL
export async function uploadFile(file) {
  // Simulate upload delay
  await new Promise((r) => setTimeout(r, 600))
  return {
    key:         'mock-' + file.name,
    name:        encodeURIComponent(file.name),
    mimetype:    file.type || 'application/octet-stream',
    downloadUrl: URL.createObjectURL(file),
    size:        file.size,
  }
}

export function downloadUrlFor(value) {
  return value?.dest?.downloadUrl ?? null
}

export function serveUrlFor(value) {
  return value?.dest?.downloadUrl ?? null
}

// Stub composables — enough for bones to import without crashing
export const resetState         = () => {}
export const useAddFetch        = () => ({})
export const useDeleteFetch     = () => ({})
export const useEditFetch       = () => ({})
export const useListFetch       = () => ({ skellist: { value: [] }, isLoading: { value: false }, reload: () => {} })
export const useListFetchAll    = () => ({ skellist: { value: [] }, isLoading: { value: false } })
export const useViewFetch       = () => ({})
export const useStructureFetch  = () => ({})
export const createControllerFetch = () => () => ({})
export class HTTPError extends Error {}
export const getCached          = () => null
export const setCached          = () => {}
export const invalidateByKey    = () => {}
export const clearCache         = () => {}
export const skelDataToFormData = (data) => data

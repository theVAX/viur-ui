// Request
export {
  useListFetch,
  useListFetchAll,
  useViewFetch,
  useAddFetch,
  useEditFetch,
  useDeleteFetch,
  useCloneFetch,
  usePreviewFetch,
  useMoveFetch,
  useListRootNodesFetch,
  useTreeFetch,
  useStructureFetch,
  uploadFile,
  downloadUrlFor,
  serveUrlFor,
  skelDataToFormData,
  normalizeEnvelope,
  normalizeStructure,
  resetState,
  HTTPError,
  createControllerFetch,
  useConfigStore,
  canAccessAdminConfig,
  buildModuleTree,
  flattenModuleTree,
  findModule,
  visibleModuleTree,
  hasModuleAccess,
  handlerType,
  useMessageStore,
  getMessageStore,
  notify,
} from "./src/request/index.js"

// Translations (Komponenten dieses Pakets; in die vue-i18n-Instanz der App mergen —
// vue-i18n ist Voraussetzung, die Komponenten übersetzen mit t() ohne Fallbacks)
export { default as deTranslations } from "./src/translations/de.js"
export { default as enTranslations } from "./src/translations/en.js"

// Legacy (@viur/vue-utils)
export {
  Request as LegacyRequest,
  HTTPError as LegacyHTTPError,
  getRequestStore,
  ListRequest as LegacyListRequest,
  destroyStore as legacyDestroyStore,
  de_translations,
  en_translations,
  boneLogic,
} from "./src/legacy/index.js"

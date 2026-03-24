import { ref, computed, reactive, onMounted } from "vue"
import { defineStore } from "pinia"
import { useFetch, createFetch } from "@vueuse/core"

export const useRequestStore = defineStore("request", () => {
  return { count, doubleCount, increment }
})

/**
 * Creates a URL string based on the given options.
 *
 * @param {Object} options - The options for URL creation.
 * @param {string|null} [options.version=null] - Optional version segment.
 * @param {string|null} [options.lang=null] - Optional language segment.
 * @param {string|string[]} options.controller - Controller segment (required). Can be a string or an array of strings.
 * @param {string} options.endpoint - Endpoint segment (required).
 * @param {string} [options.renderer="json"] - Renderer format, defaults to "json".
 * @param {string[]} [options.params=[]] - Additional parameters as an array of strings.
 * @param {Object|null} [options.query=null] - Query parameters as key-value pairs.
 *
 * @throws {Error} Throws if required parameters `controller` or `endpoint` are missing.
 *
 * @returns {string} The constructed URL string.
 *
 * @example
 * // Example with required parameters only
 * create_url({ controller: "user", endpoint: "list" });
 * // Returns: "/user/list.json"
 *
 * @example
 * // Example with all options
 * create_url({
 *   version: "v1",
 *   lang: "en",
 *   controller: ["admin", "user"],
 *   endpoint: "edit",
 *   renderer: "html",
 *   params: ["123", "details"],
 *   query: { debug: true, mode: "full" }
 * });
 * // Returns: "/v1/en/admin/user/edit.html/123/details?debug=true&mode=full"
 */
function create_url({
  version = null,
  lang = null,
  controller,
  endpoint,
  renderer = "json",
  params = null,
  query = null,
} = {}) {
  if (!controller) {
    throw new Error("Parameter 'controller' is required")
  }
  if (!endpoint) {
    throw new Error("Parameter 'endpoint' is required")
  }

  let url = ""

  if (version) url += `/${version}`
  if (lang) url += `/${lang}`

  if (Array.isArray(controller)) {
    url += "/" + controller.join("/")
  } else {
    url += `/${controller}`
  }

  url += `/${endpoint}`
  url += `.${renderer}`

  if (Array.isArray(params) && params.length > 0) {
    url += "/" + params.join("/")
  }

  if (query && typeof query === "object") {
    const queryString = new URLSearchParams(query).toString()
    if (queryString) url += `?${queryString}`
  }

  return url
}

function createControllerFetch({ endpoint, method = "GET" } = {}) {
  async function fetchCsrfToken() {
    const response = await fetch("/csrf")
    if (!response.ok) {
      throw new Error("Failed to fetch CSRF token")
    }
    const data = await response.json()
    return data.csrf_token
  }

  return (controller, args = "", data = {}, ctx = {}) =>
    createFetch({
      baseUrl: import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : window.location.origin,
      options: {
        async beforeFetch({ options, context }) {
          const { version, lang, controller, renderer, data, headers, mode, csrf } = context
          const csrfToken = csrf || (await fetchCsrfToken())
          let finalUrl = create_url({ version, lang, controller, endpoint, renderer })

          if (method.toUpperCase() === "GET" && data && typeof data === "object") {
            const queryString = new URLSearchParams(data).toString()
            if (queryString) {
              finalUrl += `?${queryString}`
            }
          } else if (method.toUpperCase() !== "GET") {
            if (data != null) {
              options.body = JSON.stringify(data)
            }
          }
          options.method = method
          options.headers = {
            ...options.headers,
            ...(method.toUpperCase() !== "GET" ? { "Content-Type": "application/json" } : {}),
            ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
            ...headers,
          }

          if (mode) {
            options.mode = mode
          }

          return { url: finalUrl, options }
        },
      },
    })(args, { context: { controller, ...ctx, ...{ data: data } } })
}

const useViewFetch = createControllerFetch({ endpoint: "view" })
const useListFetch = createControllerFetch({ endpoint: "list" })
const useEditFetch = createControllerFetch({ endpoint: "edit" })
const useDeleteFetch = createControllerFetch({ endpoint: "delete" })
const useAddFetch = createControllerFetch({ endpoint: "add" })

let result = useViewFetch("user", "1")

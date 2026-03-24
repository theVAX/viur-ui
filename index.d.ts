import type { Ref } from "vue"
import type { UseFetchReturn } from "@vueuse/core"

// ─── List ─────────────────────────────────────────────────────────────────────

export interface ListFetchInstance {
  data: Ref<Record<string, any>[]>
  structure: Ref<Record<string, any>>
  orders: Ref<any[]>
  cursor: Ref<string>
  isFetching: Ref<boolean>
  isFinished: Ref<boolean>
  error: Ref<any>
  execute: () => Promise<any>
  next: () => Promise<any>
  filter: (params: Record<string, any>) => Promise<any>
  reset: () => void
}

export interface ListFetchOptions {
  params?: Record<string, any>
  group?: string | null
  url?: string | null
  renderer?: string
  immediate?: boolean
  cached?: boolean
  ttl?: number
}

export declare const useListFetch: (controller: string | string[], options?: ListFetchOptions) => ListFetchInstance
export declare const useListFetchAll: (controller: string | string[], options?: ListFetchOptions) => ListFetchInstance

// ─── View / Add / Edit / Delete ───────────────────────────────────────────────

type ControllerFetchFn = (controller: string | string[], args?: string, data?: Record<string, any>, ctx?: Record<string, any>) => UseFetchReturn<any>

export declare const useViewFetch: ControllerFetchFn
export declare const useStructureFetch: ControllerFetchFn
export declare const useAddFetch: ControllerFetchFn
export declare const useEditFetch: ControllerFetchFn
export declare const useDeleteFetch: ControllerFetchFn

// ─── File Upload ──────────────────────────────────────────────────────────────

export interface UploadFileOptions {
  target?: string
  publicUpload?: boolean
  renderer?: string
}

export declare function uploadFile(file: File, options?: UploadFileOptions): Promise<Record<string, any>>
export declare function resetState(): Promise<void>

export declare class HTTPError extends Error {
  statusCode: number
  statusText: string
  response: Response | null
  constructor(statusCode: number, statusText: string, message?: string, response?: Response | null)
}

// ─── Skel Utilities ───────────────────────────────────────────────────────────

export declare function downloadUrlFor(bone: any, thumbnail?: boolean, renderer?: string): string | null
export declare function serveUrlFor(servingurl: string, size?: number | null, filename?: string | null, options?: string, download?: boolean): string

// ─── Skel Utilities ───────────────────────────────────────────────────────────

// ─── Low-level fetch helpers ──────────────────────────────────────────────────

export declare function get(url: string): Promise<Response>
export declare function post(url: string, data?: Record<string, any>, headers?: Record<string, string> | null): Promise<Response>
export declare function securePost(url: string, data?: Record<string, any>, headers?: Record<string, string> | null, renderer?: string): Promise<Response>

// ─── Skel Utilities ───────────────────────────────────────────────────────────

export declare function skelDataToFormData(
  skel: Record<string, any>,
  structure: Record<string, any>
): { [field: string]: any }[]

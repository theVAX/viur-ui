import type { DirectiveTransform } from "@vue/compiler-dom"

/** Compile-time v-html override: routes every v-html through `window.__sanitizeHtml` (DOMPurify). */
export declare const sanitizeVHtml: DirectiveTransform

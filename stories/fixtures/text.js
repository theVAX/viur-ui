export function createStructure(overrides = {}) {
  return {
    content: {
      type: "text",
      descr: "Inhalt",
      required: false,
      readonly: false,
      multiple: false,
      languages: null,
      params: {},

      ...overrides,
    },
  }
}

export const validHtmlStructure = {
  content: {
    type: "text",
    descr: "Inhalt (HTML)",
    required: false,
    readonly: false,
    multiple: false,
    languages: null,
    params: {},
    valid_html: {
      validTags: ["b", "i", "u", "a", "h1", "h2", "h3", "ul", "ol", "blockquote", "table", "img"],
    },
  },
}

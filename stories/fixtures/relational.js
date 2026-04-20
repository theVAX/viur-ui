export function createStructure(overrides = {}) {
  return {
    entry: {
      type: "relational",
      descr: "Eintrag",
      required: false,
      readonly: false,
      multiple: false,
      languages: null,
      params: {},
      using: null,
      module: "article",
      format: "$(dest.name)",
      ...overrides,
    },
  }
}

export const exampleEntry = {
  dest: { key: "ag9zfnZpdXItdGVzdHIRCxIHQXJ0aWNsZRiAgICAgICAgAoM", name: "Beispiel-Artikel" },
  rel: {},
}

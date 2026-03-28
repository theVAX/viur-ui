export function createStructure(overrides = {}) {
  return {
    active: {
      type: "bool",
      descr: "Aktiv",
      required: false,
      readonly: false,
      multiple: false,
      languages: null,
      params: {},
      ...overrides,
    },
  }
}

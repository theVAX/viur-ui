export function createStructure(overrides = {}) {
  return {
    title: {
      type: "str",
      descr: "Titel",
      required: false,
      readonly: false,
      multiple: false,
      languages: null,
      params: {},
      ...overrides,
    },
  }
}

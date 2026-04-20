export function createStructure(overrides = {}) {
  return {
    color: {
      type: "color",
      descr: "Farbe",
      required: false,
      readonly: false,
      multiple: false,
      languages: null,
      params: {},
      ...overrides,
    },
  }
}

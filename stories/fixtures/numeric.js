export function createStructure(overrides = {}) {
  return {
    amount: {
      type: "numeric",
      descr: "Betrag",
      required: false,
      readonly: false,
      multiple: false,
      languages: null,
      min: null,
      max: null,
      precision: 0,
      params: {},
      ...overrides,
    },
  }
}

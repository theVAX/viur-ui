export function createStructure(overrides = {}) {
  return {
    code: {
      type: "raw.code.python",
      descr: "Code",
      required: false,
      readonly: false,
      multiple: false,
      languages: null,
      params: {},
      ...overrides,
    },
  }
}

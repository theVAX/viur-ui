export function createStructure(overrides = {}) {
  return {
    email: {
      type: "str.email",
      descr: "E-Mail",
      required: false,
      readonly: false,
      multiple: false,
      languages: null,
      params: {},
      ...overrides,
    },
  }
}

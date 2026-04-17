export function createStructure(overrides = {}) {
  return {
    password: {
      type: "password",
      descr: "Passwort",
      required: false,
      readonly: false,
      multiple: false,
      languages: null,
      params: {},
      ...overrides,
    },
  }
}

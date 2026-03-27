export function createStructure(overrides = {}) {
  return {
    content: {
      type: 'text',
      descr: 'Inhalt',
      required: false,
      readonly: false,
      multiple: false,
      languages: null,
      params: {},

      ...overrides,
    },
  }
}

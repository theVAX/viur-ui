export function createStructure(overrides = {}) {
  return {
    key: {
      type: 'key',
      descr: 'Schlüssel',
      required: false,
      readonly: true,
      multiple: false,
      languages: null,
      params: {},
      ...overrides,
    },
  }
}

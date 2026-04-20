export function createStructure(overrides = {}) {
  return {
    phone: {
      type: 'str.phone',
      descr: 'Telefon',
      required: false,
      readonly: false,
      multiple: false,
      languages: null,
      params: {},
      ...overrides,
    },
  }
}

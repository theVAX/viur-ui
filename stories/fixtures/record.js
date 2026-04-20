export function createStructure(overrides = {}) {
  return {
    address: {
      type: "record",
      descr: "Adresse",
      required: false,
      readonly: false,
      multiple: false,
      languages: null,
      params: {},
      using: {
        street: {
          type: "str",
          descr: "Straße",
          required: false,
          readonly: false,
          multiple: false,
          visible: true,
          languages: null,
          params: {},
        },
        city: {
          type: "str",
          descr: "Stadt",
          required: false,
          readonly: false,
          multiple: false,
          visible: true,
          languages: null,
          params: {},
        },
        zip: {
          type: "str",
          descr: "PLZ",
          required: false,
          readonly: false,
          multiple: false,
          visible: true,
          languages: null,
          params: {},
        },
      },
      ...overrides,
    },
  }
}

export function createStructure(overrides = {}) {
  return {
    status: {
      type: "select",
      descr: "Status",
      required: false,
      readonly: false,
      multiple: false,
      languages: null,
      values: [
        ["draft", "Entwurf"],
        ["published", "Veröffentlicht"],
        ["archived", "Archiviert"],
      ],
      params: {},
      ...overrides,
    },
  }
}

export function createStructure(overrides = {}) {
  return {
    publishedAt: {
      type: "date",
      descr: "Veröffentlicht am",
      required: false,
      readonly: false,
      multiple: false,
      languages: null,
      date: true,
      time: false,
      params: {},
      ...overrides,
    },
  }
}

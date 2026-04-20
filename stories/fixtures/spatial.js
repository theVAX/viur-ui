export function createStructure(overrides = {}) {
  return {
    location: {
      type: "spatial",
      descr: "Koordinaten",
      required: false,
      readonly: false,
      multiple: false,
      languages: null,
      params: {},
      boundslat: [-90, 90],
      boundslng: [-180, 180],
      ...overrides,
    },
  }
}

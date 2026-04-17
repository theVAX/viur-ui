export function createStructure(overrides = {}) {
  return {
    file: {
      type: "relational.tree.leaf.file.file",
      descr: "Datei",
      required: false,
      readonly: false,
      multiple: false,
      languages: null,
      params: {},
      using: null,
      ...overrides,
    },
  }
}

const PLACEHOLDER_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150'%3E%3Crect width='200' height='150' fill='%23c8dff0'/%3E%3Ctext x='100' y='83' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%23456'%3EBild%3C/text%3E%3C/svg%3E"

export const exampleImage = {
  dest: {
    key: "img-key-1",
    name: "vorschau.jpg",
    mimetype: "image/jpeg",
    size: 51200,
    downloadUrl: PLACEHOLDER_SVG,
  },
  rel: {},
}

export const exampleFile = {
  dest: {
    key: "ag9zfnZpdXItdGVzdHIRCxIERmlsZRiAgICAgICAgAoM",
    name: "beispiel.pdf",
    mimetype: "application/pdf",
    size: 102400,
  },
  rel: {},
}

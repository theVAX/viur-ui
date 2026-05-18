export function makeStructure(state, extras = {}) {
  return {
    [state.boneName]: {
      type: state.boneType,
      descr: state.descr,
      required: state.required,
      readonly: state.readonly,
      multiple: state.multiple,
      languages: null,
      params: {},
      ...extras,
    },
  }
}

export function parseLangs(state) {
  return state.multilang
    ? state.languages
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean)
    : null
}

export function src(structure, skel, extra = {}) {
  const name = Object.keys(structure)[0]
  const attrs = [`name="${name}"`]
  if (extra.languages) attrs.push(`:languages="${JSON.stringify(extra.languages).replace(/"/g, "'")}"`)
  return [
    `<Bone`,
    `  ${attrs.join("\n  ")}`,
    `  :structure="structure"`,
    `  :skel="skel"`,
    `/>`,
    ``,
    `<!-- structure -->`,
    JSON.stringify(structure, null, 2),
    ``,
    `<!-- skel -->`,
    JSON.stringify(skel, null, 2),
  ].join("\n")
}

/**
 * Convert structure to object format.
 * ViUR can return structure as array [[name, bone], ...] or object {name: bone}.
 * bone["using"] (relational/record sub-structure) may still use array format.
 */
function normalizeStructure(structure) {
  if (!structure) return {}
  if (Array.isArray(structure)) {
    return Object.fromEntries(structure.map(([name, bone]) => [name, bone]))
  }
  return structure
}

/**
 * Convert skel values + structure to a flat array of {fieldName: value} objects
 * suitable for building a FormData or JSON payload for ViUR edit/add endpoints.
 *
 * Handles: multilingual bones, multiple bones, record bones, relational bones,
 * spatial bones, raw.json bones.
 *
 * @param {Record<string, any>} skel   - skel values (e.g. from view response)
 * @param {Record<string, any>} structure - normalized structure object
 * @returns {{ [field: string]: any }[]}
 */
export function skelDataToFormData(skel, structure) {
  function handleEntry(result, fieldName, bone, val) {
    if (bone["type"].startsWith("record")) {
      const struct = normalizeStructure(bone["using"])
      for (const [subField, subBone] of Object.entries(struct)) {
        result = result.concat(boneToForm(`${fieldName}.${subField}`, subBone, val?.[subField]))
      }
    } else if (val === Object(val) && bone["using"]) {
      // relational bone with sub-structure
      if (val["dest"]?.["key"]) {
        const struct = normalizeStructure(bone["using"])
        for (const [subField, subBone] of Object.entries(struct)) {
          result = result.concat(boneToForm(`${fieldName}.${subField}`, subBone, val["rel"]?.[subField]))
        }
        result.push({ [`${fieldName}.key`]: val["dest"]["key"] })
      } else {
        result.push({ [fieldName]: null })
      }
    } else if (bone["type"].startsWith("spatial") && val) {
      result.push({ [`${fieldName}.lat`]: val[0] })
      result.push({ [`${fieldName}.lng`]: val[1] })
    } else if (bone["type"].startsWith("raw.json") && val) {
      result.push({ [fieldName]: JSON.stringify(val) })
    } else if (val === Object(val)) {
      // plain relational bone (no using)
      result.push({ [fieldName]: val["dest"]?.["key"] ?? null })
    } else {
      result.push({ [fieldName]: val })
    }
    return result
  }

  function boneToForm(fieldName, bone, value) {
    let result = []
    const indexBone = bone["type"].startsWith("record")
    const languages = bone["languages"] || ["none"]
    let languageValue = value

    for (const lang of languages) {
      let currentFieldName = fieldName
      if (lang !== "none") {
        currentFieldName += `.${lang}`
        value = languageValue?.[lang]
      }

      if (bone["multiple"]) {
        const values = value ?? []
        for (const [idx, val] of values.entries()) {
          const indexedName = (indexBone || val?.["rel"] || (bone["using"] && val?.["rel"] !== null))
            ? `${currentFieldName}.${idx}`
            : currentFieldName
          result = handleEntry(result, indexedName, bone, val)
        }
        if (values.length === 0) {
          result.push({ [currentFieldName]: null })
        }
      } else {
        result = handleEntry(result, currentFieldName, bone, value)
      }
    }
    return result
  }

  return Object.entries(structure)
    .flatMap(([fieldName, bone]) => boneToForm(fieldName, bone, skel[fieldName]))
}
